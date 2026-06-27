# SmartTeam PIMS - Project Information Management System

A comprehensive Academic Project Management System tailored for FPT University to manage course projects, group assignments, tasks, and student/mentor progress.

---

## 📁 Refactored Project Structure

The project has been restructured for improved safety, isolation, and modularity:

```
SWP391_PIMS/
├── frontend/                 # Self-contained React + Vite UI Application
│   ├── src/                  # React source files (components, routes, state)
│   ├── public/               # Static web assets
│   ├── package.json          # Frontend dependencies & configurations
│   ├── vite.config.js        # Vite configurations
│   └── eslint.config.js      # ESLint configuration
│
├── backend/                  # Self-contained Spring Boot Backend REST API
│   ├── src/                  # Java/Spring Boot source files
│   ├── pom.xml               # Maven configuration
│   ├── scripts/              # PowerShell execution scripts (start-backend.ps1)
│   └── tools/                # Local build tools (Apache Maven)
│
├── database/                 # Database Schema & Initialization scripts
│   └── database_setup.sql    # SQL Server / H2 initialization script
│
├── documents/                # Comprehensive documentation, checklists, guides
│   ├── COMPLETE_DOCUMENTATION.md
│   ├── DATABASE_SETUP_GUIDE.md
│   ├── DEVELOPMENT_CHECKLIST.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── QUICK_START.md
│
├── unsorted/                 # Legacy/temporary typo files isolated for safety
│   ├── ({
│   ├── [
│   ├── {
│   ├── console.error('error'
│   └── console.log('body'
│
├── package.json              # Root workspace orchestrator package
├── .gitignore                # Global git ignore configuration
└── LICENSE                   # Project license
```

---

## 🚀 How to Run the Project

For ease of use, a root-level workspace orchestration package has been set up to allow execution of scripts directly from the project root.

### Prerequisites
- **Node.js** (v18 or higher)
- **Java JDK** (v17 or higher)

---

### Step 1: Install Frontend Dependencies
From the root workspace directory, run:
```bash
npm run install:frontend
```
*Alternatively, navigate to the `frontend/` folder and run `npm install`.*

### Step 2: Configure Environment Variables
Inside the `frontend/` directory, create a `.env` file containing:
```env
VITE_API_URL=/api
VITE_APP_NAME=SmartTeam PIMS
VITE_APP_ENV=development
```

### Step 3: Run the Backend API Server
From the root workspace directory, run:
```bash
npm run backend
```
*This powershell script automatically configures, downloads, and boots the Spring Boot application using Maven on port `8080`.*

### Step 4: Start the Frontend Dev Server
From the root workspace directory, run:
```bash
npm run dev
```
The application will be accessible at: **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Workspace Orchestration Commands Reference

| Script Command | Execution Context | Description |
|:---|:---|:---|
| `npm run install:frontend` | Root | Installs dependencies inside `/frontend` |
| `npm run dev` | Root | Starts the frontend dev server (`http://localhost:5173`) |
| `npm run dev:frontend` | Root | Starts the frontend dev server |
| `npm run build:frontend` | Root | Compiles production assets into `/frontend/dist` |
| `npm run lint:frontend` | Root | Lints frontend files using ESLint |
| `npm run backend` | Root | Runs the Spring Boot server |
