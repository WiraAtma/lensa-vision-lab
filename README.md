# LensaVision Lab

LensaVision Lab adalah platform AI Vision berbasis **React**, **FastAPI**, dan **PyTorch** yang berisi beberapa fitur image classification dalam satu aplikasi. Project ini dibuat sebagai portfolio sekaligus open source untuk mempelajari pengembangan AI dari proses training hingga deployment.

## Features

* Handwritten Digit Recognition
* Food Classification
* Animal Classification
* Plant Disease Classification
* Skin Disease Classification
* Prediction History
* REST API menggunakan FastAPI
* React Frontend

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Axios
* React Bootstrap

### Backend

* FastAPI
* Pydantic
* Uvicorn

### AI / Deep Learning

* PyTorch
* Torchvision
* OpenCV
* Pillow

### Database

* PostgreSQL *(planned)*

## Project Structure

```text
LensaVision-Lab/
│
├── frontend/          # React Application
├── backend/           # FastAPI Application
├── experiment/        # Training & Experiments
├── model_store/       # Trained Models
├── docs/              # Documentation
└── README.md
```

## Models

Setiap model berada di dalam folder `model_store`.

```text
model_store/
│
├── food_classification/
├── animal_classification/
├── handwritten_digit/
├── plant_disease/
└── skin_disease/
```

Masing-masing folder berisi:

* `model.pth`
* `class_names.json`
* `model.json`

## Getting Started

### Clone Repository

```bash
git clone https://github.com/<username>/LensaVision-Lab.git
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Training

Seluruh source code training berada di folder `experiment/`.

Dataset **tidak disertakan** di repository karena ukuran file yang besar. Silakan mengunduh dataset sesuai dokumentasi masing-masing experiment.

## Open Source

Repository ini bersifat open source dan dapat digunakan sebagai referensi pembelajaran mengenai:

* Image Classification
* CNN Architecture
* Transfer Learning
* FastAPI Deployment
* React Integration
* AI Project Architecture

## License

MIT License
