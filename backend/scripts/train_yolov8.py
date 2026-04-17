"""Train, validate, and test the PlantVillage disease classifier."""

from __future__ import annotations

import argparse
import random
import shutil
import subprocess
from pathlib import Path

from loguru import logger

_YOLO_IMPORT_ERROR = None


VALID_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
PROJECT_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PROJECT_ROOT.parent
RAW_DATASET_CANDIDATES = [
    REPO_ROOT / "Dataset" / "PlantVillage",
    PROJECT_ROOT / "data" / "datasets" / "plantvillage",
]
SPLIT_DATASET_ROOT = PROJECT_ROOT / "data" / "datasets" / "plantvillage_cls"
RUN_NAME = "krishiraksha_cls"
MODEL_SOURCE = "yolov8n-cls.pt"
MODEL_ARTIFACT = PROJECT_ROOT / "models" / "weights" / "krishiraksha_yolov8n-cls.pt"
LEGACY_MODEL_ARTIFACT = PROJECT_ROOT / "models" / "weights" / "krishiraksha_yolov8n.pt"


def _ensure_ultralytics():
    global _YOLO_IMPORT_ERROR
    try:
        from ultralytics import YOLO as ultralytics_yolo
    except ImportError as exc:
        _YOLO_IMPORT_ERROR = exc
        raise RuntimeError(
            "ultralytics is not installed. Install backend dependencies with YOLO support enabled."
        ) from exc
    except OSError as exc:
        _YOLO_IMPORT_ERROR = exc
        raise RuntimeError(
            "Torch could not load its native DLLs in this environment. Windows application control is blocking the YOLO training runtime."
        ) from exc
    return ultralytics_yolo


def _resolve_source_root() -> Path:
    for candidate in RAW_DATASET_CANDIDATES:
        if candidate.exists() and any(candidate.iterdir()):
            return candidate

    clone_target = RAW_DATASET_CANDIDATES[1]
    clone_target.parent.mkdir(parents=True, exist_ok=True)
    logger.info("PlantVillage dataset not found locally, cloning to {}", clone_target)
    subprocess.run(
        ["git", "clone", "--depth", "1", "https://github.com/spMohanty/PlantVillage-Dataset", str(clone_target)],
        check=True,
    )
    return clone_target


def _image_files(folder: Path) -> list[Path]:
    return [path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in VALID_IMAGE_SUFFIXES]


def prepare_split_dataset(
    source_root: Path,
    target_root: Path,
    train_ratio: float = 0.7,
    val_ratio: float = 0.2,
    test_ratio: float = 0.1,
    seed: int = 42,
    force: bool = False,
    max_images_per_class: int | None = None,
) -> dict[str, dict[str, int]]:
    if not source_root.exists():
        raise FileNotFoundError(f"Raw dataset root not found: {source_root}")

    if abs((train_ratio + val_ratio + test_ratio) - 1.0) > 1e-6:
        raise ValueError("train_ratio + val_ratio + test_ratio must equal 1.0")

    if force and target_root.exists():
        shutil.rmtree(target_root)

    random.seed(seed)
    summary: dict[str, dict[str, int]] = {"train": {}, "val": {}, "test": {}}
    class_dirs = [path for path in source_root.iterdir() if path.is_dir()]

    if not class_dirs:
        raise RuntimeError(f"No class folders found under {source_root}")

    for class_dir in sorted(class_dirs):
        images = _image_files(class_dir)
        if not images:
            logger.warning("Skipping empty class folder {}", class_dir.name)
            continue

        random.shuffle(images)
        if max_images_per_class is not None:
            images = images[:max_images_per_class]

        total = len(images)
        train_count = max(1, int(total * train_ratio))
        val_count = max(1, int(total * val_ratio)) if total >= 3 else 0
        test_count = total - train_count - val_count

        if test_count < 0:
            test_count = 0
            if train_count + val_count > total:
                train_count = max(1, total - val_count)

        if train_count + val_count + test_count < total:
            test_count = total - train_count - val_count

        split_map = {
            "train": images[:train_count],
            "val": images[train_count : train_count + val_count],
            "test": images[train_count + val_count : train_count + val_count + test_count],
        }

        for split_name, split_images in split_map.items():
            split_dir = target_root / split_name / class_dir.name
            split_dir.mkdir(parents=True, exist_ok=True)
            summary[split_name][class_dir.name] = len(split_images)
            for source_file in split_images:
                shutil.copy2(source_file, split_dir / source_file.name)

    return summary


def train_model(
    epochs: int = 1,
    imgsz: int = 224,
    batch: int = 16,
    seed: int = 42,
    max_images_per_class: int | None = None,
    force_prepare: bool = False,
):
    """Train, validate, and test the classification model."""
    YOLO = _ensure_ultralytics()

    source_root = _resolve_source_root()
    logger.info("Preparing classification dataset at {}", SPLIT_DATASET_ROOT)
    summary = prepare_split_dataset(
        source_root=source_root,
        target_root=SPLIT_DATASET_ROOT,
        seed=seed,
        force=force_prepare,
        max_images_per_class=max_images_per_class,
    )
    logger.success("Dataset prepared: {}", summary)

    logger.info("Initializing YOLO classification model from {}", MODEL_SOURCE)
    try:
        import torch

        original_torch_load = torch.load

        def trusted_torch_load(*args, **kwargs):
            kwargs.setdefault("weights_only", False)
            return original_torch_load(*args, **kwargs)

        torch.load = trusted_torch_load  # type: ignore[assignment]
    except Exception:
        logger.warning("Could not configure trusted checkpoint loading")

    model = YOLO(MODEL_SOURCE)

    logger.info("Starting training for {} epoch(s)...", epochs)
    results = model.train(
        data=str(SPLIT_DATASET_ROOT),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=RUN_NAME,
        project=str(PROJECT_ROOT / "runs"),
        exist_ok=True,
    )

    logger.success("Training complete")
    logger.info("Run directory: {}", results.save_dir)

    logger.info("Running validation on val split")
    val_metrics = model.val(data=str(SPLIT_DATASET_ROOT), split="val", imgsz=imgsz)
    logger.info("Validation metrics: {}", val_metrics)

    logger.info("Running validation on test split")
    test_metrics = model.val(data=str(SPLIT_DATASET_ROOT), split="test", imgsz=imgsz)
    logger.info("Test metrics: {}", test_metrics)

    best_weights = Path(results.save_dir) / "weights" / "best.pt"
    if best_weights.exists():
        MODEL_ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(best_weights, MODEL_ARTIFACT)
        shutil.copy2(best_weights, LEGACY_MODEL_ARTIFACT)
        logger.success("Best weights copied to {}", MODEL_ARTIFACT)

    return {
        "results_dir": str(results.save_dir),
        "validation": str(val_metrics),
        "test": str(test_metrics),
        "model_artifact": str(MODEL_ARTIFACT),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and validate the KrishiRaksha YOLOv8 classifier.")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--imgsz", type=int, default=224)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-images-per-class", type=int, default=None)
    parser.add_argument("--force-prepare", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train_model(
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        seed=args.seed,
        max_images_per_class=args.max_images_per_class,
        force_prepare=args.force_prepare,
    )
