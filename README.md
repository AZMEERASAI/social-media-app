# Social Media App Setup

A complete full-stack social media application featuring threaded comments, a likes system, and a rolling 24-hour karma leaderboard.

## Tech Stack
- **Backend:** Django, Django REST Framework, SQLite (Dev) / PostgreSQL (Prod)
- **Frontend:** React, Vite, TailwindCSS

## Prerequisites
- Python 3.10+
- Node.js 18+

## Quick Start (Local Development)

### 1. Setup Backend
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Run server
python manage.py runserver
```
The backend API usage is available at `http://localhost:8000/api/`.

### 2. Setup Frontend
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
The application will run at `http://localhost:5173` (or 5174).

## Features
- **Threaded Comments:** Infinite nesting depth, fetched efficiently in a single query.
- **Likes:** Polymorphic likes for Posts and Comments.
- **Leaderboard:** Top users based on karma earned in the last 24 hours.
