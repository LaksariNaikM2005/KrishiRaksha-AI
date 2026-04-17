from __future__ import annotations

import os
import subprocess
from pathlib import Path
from loguru import logger

from train_yolov8 import prepare_split_dataset

# List of datasets from high-quality sources
DATASETS = {
    "plantvillage": "emmareade/plantvillage-dataset",
    "paddy_doctor": "vbookshelf/paddy-doctor-paddy-disease-classification",
    "wheat_leaf": "vbookshelf/wheat-leaf-disease-dataset",
    "crop_yield_india": "877tst7tyf/1", # This is Mendeley, requires manual download or direct link
}

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATASETS_ROOT = PROJECT_ROOT / "data" / "datasets"
PLANTVILLAGE_RAW_ROOT = DATASETS_ROOT / "plantvillage"
PLANTVILLAGE_SPLIT_ROOT = DATASETS_ROOT / "plantvillage_cls"
VALID_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _has_image_files(folder: Path) -> bool:
    return any(child.is_file() and child.suffix.lower() in VALID_IMAGE_SUFFIXES for child in folder.iterdir())


def _looks_like_class_root(folder: Path) -> bool:
    if not folder.exists() or not folder.is_dir():
        return False
    class_dirs = [child for child in folder.iterdir() if child.is_dir()]
    if not class_dirs:
        return False
    return any(_has_image_files(class_dir) for class_dir in class_dirs)


def _resolve_plantvillage_root() -> Path:
    if _looks_like_class_root(PLANTVILLAGE_RAW_ROOT):
        return PLANTVILLAGE_RAW_ROOT

    nested_root = PLANTVILLAGE_RAW_ROOT / "PlantVillage"
    if _looks_like_class_root(nested_root):
        return nested_root

    if not PLANTVILLAGE_RAW_ROOT.exists() or not any(PLANTVILLAGE_RAW_ROOT.iterdir()):
        logger.info("PlantVillage dataset not found locally, cloning to {}", PLANTVILLAGE_RAW_ROOT)
        PLANTVILLAGE_RAW_ROOT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "clone", "--depth", "1", "https://github.com/spMohanty/PlantVillage-Dataset", str(PLANTVILLAGE_RAW_ROOT)],
            check=True,
        )

    if _looks_like_class_root(PLANTVILLAGE_RAW_ROOT):
        return PLANTVILLAGE_RAW_ROOT

    if _looks_like_class_root(PLANTVILLAGE_RAW_ROOT / "PlantVillage"):
        return PLANTVILLAGE_RAW_ROOT / "PlantVillage"

    raise RuntimeError(
        f"Could not locate a PlantVillage class-folder root under {PLANTVILLAGE_RAW_ROOT}."
    )

def check_kaggle_api():
    """Verify if Kaggle CLI is installed and configured."""
    try:
        subprocess.run(["kaggle", "--version"], check=True, capture_output=True)
        kaggle_credentials = Path.home() / ".kaggle" / "kaggle.json"
        if not kaggle_credentials.exists():
            logger.warning("Kaggle CLI is installed, but {} is missing. Skipping Kaggle datasets.", kaggle_credentials)
            return False
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("Kaggle CLI not found. Please run: pip install kaggle")
        logger.info("Then configure your API key: https://github.com/Kaggle/kaggle-api")
        return False

def download_kaggle_dataset(dataset_id, target_dir):
    """Download a dataset using the Kaggle CLI."""
    os.makedirs(target_dir, exist_ok=True)
    logger.info(f"Downloading {dataset_id} to {target_dir}...")
    try:
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", dataset_id, "-p", target_dir, "--unzip"],
            check=True
        )
        logger.success(f"Successfully downloaded {dataset_id}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to download {dataset_id}: {e}")

def download_github_dataset(repo_url, target_dir):
    """Download a dataset by cloning a GitHub repo."""
    if os.path.exists(target_dir):
        logger.info(f"Target directory {target_dir} already exists. Skipping clone.")
        return
    logger.info(f"Cloning {repo_url} to {target_dir}...")
    try:
        subprocess.run(["git", "clone", "--depth", "1", repo_url, target_dir], check=True)
        logger.success(f"Successfully cloned {repo_url}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to clone {repo_url}: {e}")

def main():
    logger.info("--- KrishiRaksha Dataset Downloader ---")
    
    # Create data directory in backend
    DATASETS_ROOT.mkdir(parents=True, exist_ok=True)

    # 1. Download PlantVillage via GitHub (No API Key Required)
    plantvillage_source = _resolve_plantvillage_root()
    logger.info("PlantVillage source root: {}", plantvillage_source)

    if PLANTVILLAGE_SPLIT_ROOT.exists() and any(PLANTVILLAGE_SPLIT_ROOT.iterdir()):
        logger.info("PlantVillage split dataset already exists at {}", PLANTVILLAGE_SPLIT_ROOT)
    else:
        logger.info("Preparing train/val/test split at {}", PLANTVILLAGE_SPLIT_ROOT)
        summary = prepare_split_dataset(
            source_root=plantvillage_source,
            target_root=PLANTVILLAGE_SPLIT_ROOT,
            force=True,
        )
        logger.success("Prepared PlantVillage splits: {}", summary)

    # 2. Optional Kaggle datasets are opt-in to avoid failing on unconfigured local machines.
    extra_datasets_enabled = os.getenv("KRISHIRAKSHA_DOWNLOAD_EXTRA_DATASETS", "").lower() in {"1", "true", "yes"}
    if extra_datasets_enabled and check_kaggle_api():
        for name, ds_id in DATASETS.items():
            if name == "plantvillage":
                continue  # Already handled via GitHub
            if "/" in ds_id:
                target = DATASETS_ROOT / name
                if target.exists() and any(target.iterdir()):
                    logger.info("Dataset {} already exists. Skipping.", name)
                else:
                    download_kaggle_dataset(ds_id, str(target))
    else:
        logger.info("Skipping optional Kaggle datasets. Set KRISHIRAKSHA_DOWNLOAD_EXTRA_DATASETS=1 to enable them.")

    logger.success("All tasks complete!")

if __name__ == "__main__":
    main()
