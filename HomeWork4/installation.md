# Local Environment Setup Guide

Welcome to the Cloud Computing HW4 team project! Follow these instructions to set up your local development environment so we can all start coding.

## 1. Azure CLI Setup
Every team member needs the Azure CLI to deploy and manage cloud resources locally.

1. Install the Azure CLI for your operating system if you haven't already.
2. Open your terminal and authenticate your machine:
   ```bash
   az login
   ```
3. A browser window will open. Log in with your University/Azure Student account. 

## 2. Backend Setup (FastAPI & Python)
We are using FastAPI and SQLModel for the backend. 

1. Ensure you have Python 3 installed.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create a virtual environment (you only need to do this once):
   ```bash
   python3 -m venv .venv
   ```
4. Activate the virtual environment:
   * **Linux/Mac**: `source .venv/bin/activate`
   * **Windows**: `.venv\Scripts\activate`
5. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. **Secrets:** There is a `.env` file in the backend folder. Ask the team lead for the secret keys (Database passwords, Azure connection strings) and add them there. **Do not commit the populated `.env` file to GitHub.** (It is already correctly listed in our `.gitignore`).

## 3. Frontend Setup (React & Vite)
We are using React for the frontend unified Single-Page Application.

1. Ensure you have Node.js installed.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the required frontend dependencies (React, React Router, Azure MSAL):
   ```bash
   npm install
   ```
4. To run the frontend development server and see the app locally:
   ```bash
   npm run dev
   ```
