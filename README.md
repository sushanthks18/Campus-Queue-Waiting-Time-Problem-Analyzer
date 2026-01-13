# Campus Queue & Waiting-Time Problem Analyzer

A full-stack web application designed to analyze and optimize queuing times across various campus facilities (e.g., Canteen, Library, Admin Office). This tool allows students to log their waiting times and provides administrators with analytics to identify bottlenecks and peak hours.

## 🚀 Technology Stack

### Frontend
- **React.js**: UI library for building the user interface.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library.
- **Axios**: For making HTTP requests.

### Backend
- **FastAPI**: Modern, fast (high-performance) web framework for building APIs with Python.
- **MongoDB**: NoSQL database for storing user and queue data.
- **Motor**: Asynchronous Python driver for MongoDB.
- **PyJWT**: For handling JSON Web Tokens (authentication).

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Python** (3.9 or higher)
- **Node.js** (v16 or higher) & **npm**
- **MongoDB** (Running locally or a cloud URL)

## 🛠️ Installation & Setup

### 1. Database Setup
Ensure your local MongoDB instance is running. By default, the app looks for `mongodb://localhost:27017`.
```bash
# Start MongoDB (macOS/Linux)
brew services start mongodb-community
# OR run manually
mongod --dbpath /path/to/data
```

### 2. Backend Setup
Navigate to the root directory and set up the Python backend.

```bash
# Navigate to the project root
cd "Campus Queue & Waiting-Time Problem Analyzer"

# Create a virtual environment
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r app/backend/requirements.txt

# Start the Backend Server
python app/backend/server.py
```
The backend API will run at `http://localhost:8001`.

### 3. Frontend Setup
Open a new terminal and set up the React frontend.

```bash
# Navigate to the frontend directory
cd app/frontend

# Install Node dependencies
npm install

# Start the Development Server
npm start
```
The application will open at `http://localhost:3000`.

## 📂 Project Structure

```
├── app/
│   ├── backend/
│   │   ├── server.py        # Main API application entry point
│   │   ├── requirements.txt # Python dependencies
│   │   └── .env             # Backend environment variables
│   └── frontend/
│       ├── src/
│       │   ├── pages/       # React pages (Dashboard, Login, etc.)
│       │   ├── components/  # Reusable UI components
│       │   ├── App.js       # Main React component & Routing
│       │   └── index.css    # Global styles (Tailwind directives)
│       ├── package.json     # Node dependencies
│       └── .env             # Frontend environment variables
└── README.md
```

## ✨ Features
- **User Authentication**: Secure Login and Registration system using JWT.
- **Student Dashboard**: Submit entry/exit times and view personal history.
- **Admin Dashboard**: View global analytics, peak hours, and comprehensive queue data.
- **Real-time Analytics**: Insights into average waiting times and busy periods.

## 📝 Configuration
- **Backend Port**: 8001 (Configurable in `server.py`)
- **Frontend Port**: 3000 (Default React port)
- **Database Name**: `campus_queue_analyzer`

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
