# Agricultural Datasets for KrishiRaksha AI

This document tracks the datasets used for training our AI models (YOLOv8 for disease detection and Gemini for advisories).

## 🌿 High-Quality Sources

### 1. PlantVillage Dataset
- **Description**: 54,306 images of plant leaves classified into 38 classes (crop-disease pairs).
- **Source**: [spMohanty/PlantVillage-Dataset (GitHub)](https://github.com/spMohanty/PlantVillage-Dataset)
- **Status**: Automated via `download_datasets.py`.

### 2. Paddy Doctor (Rice Disease)
- **Description**: Images of paddy leaves with various diseases like blast, brown spot, etc.
- **Source**: [Kaggle](https://www.kaggle.com/vbookshelf/paddy-doctor-paddy-disease-classification)
- **Status**: Automated via Kaggle CLI in `download_datasets.py`.

### 3. Wheat Leaf Disease
- **Description**: Dataset focusing on wheat rust and other leaf diseases.
- **Source**: [Kaggle](https://www.kaggle.com/vbookshelf/wheat-leaf-disease-dataset)
- **Status**: Automated via Kaggle CLI in `download_datasets.py`.

### 4. Crop Yield Prediction (India)
- **Description**: Historical data for crop yield prediction across Indian states.
- **Source**: [Mendeley Data](https://data.mendeley.com/datasets/877tst7tyf/1)
- **Manual Download**:
    1. Visit the link above.
    2. Download the `.csv` or `.xlsx` files.
    3. Place them in `krishiraksha-api/data/datasets/crop_yield_india/`.

## 🛠️ How to Download
Run the following from the `krishiraksha-api` root:
```bash
python scripts/download_datasets.py
```

> [!NOTE]
> For Kaggle datasets, ensure you have `~/.kaggle/kaggle.json` configured with your API credentials.
