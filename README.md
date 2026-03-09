# Cyber Fraud Sentinel

## Overview

Cyber Fraud Sentinel is an AI-powered cyber fraud threat monitoring system that allows users to report suspicious activities, upload evidence, and track fraud threat levels through a dynamic threat index dashboard.

## Features

- Incident reporting system
- Evidence upload support
- Real-time threat index monitoring
- Fraud incident dashboard
- Admin monitoring panel
- Secure backend APIs
- Modular frontend UI

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Python
- FastAPI

### Database
- PostgreSQL / SQLite

## Project Structure

```
backend/
├── main.py
├── models.py
├── database.py
├── requirements.txt

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
```

## Installation

### Clone the repository

```bash
git clone https://github.com/Surjune/cyber-fraud-sentinel.git
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

## Future Improvements

- AI-based fraud detection
- Real-time alert system
- Graph analytics for fraud networks
- Automated risk scoring

## License

MIT License
