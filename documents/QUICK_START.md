# 🚀 Quick Start Guide - PIMS Development

## Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+
- SQL Server 2019+
- Git

## Quick Setup (5 minutes)

### Step 1: Database Setup
```sql
-- Chạy trong SQL Server Management Studio
CREATE DATABASE ProjectSWP391;
```

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Update database connection in src/main/resources/application.properties
# - Server: localhost (hoặc tên server của bạn)
# - Username: sa
# - Password: [Your SQL Server password]

# Build and run
mvn clean install
mvn spring-boot:run

# Backend sẽ chạy tại: http://localhost:8080
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend (root directory)
cd ..

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Frontend sẽ chạy tại: http://localhost:5173
```

### Step 4: Login
```
Email: admin@fpt.edu.vn
Password: admin123
Role: Admin
```

---

## Available Scripts

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Backend
```bash
mvn clean build    # Build project
mvn spring-boot:run  # Run application
mvn test          # Run tests
```

---

## Project Structure Overview

### Backend Stack
- **Framework**: Spring Boot 3.3.3
- **Database**: JPA + Hibernate + SQL Server
- **API**: RESTful with CORS enabled
- **Port**: 8080

### Frontend Stack
- **Framework**: React 19
- **UI**: Bootstrap 5 + React Bootstrap
- **Routing**: React Router v7
- **HTTP**: Axios
- **Build**: Vite
- **Port**: 5173

---

## API Endpoints Summary

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Students only)
- `POST /api/auth/create` - Create account (Admin only)
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/pending` - Get pending accounts
- `PUT /api/auth/approve/{id}` - Approve account

### Projects
- `GET /api/projects` - All projects
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - All tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Users
- `GET /api/users/role/{role}` - Get users by role
- `GET /api/users/mentors` - Get all mentors
- `GET /api/users/students` - Get all students

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/user/{id}/stats` - User statistics

---

## Troubleshooting

### Backend won't start
- Check if SQL Server is running
- Verify database connection in application.properties
- Check port 8080 is not in use

### Frontend won't load
- Clear browser cache and reinstall node_modules
- Check if backend is running
- Verify VITE_API_URL in .env

### CORS errors
- CORS is enabled in AuthController, ProjectController, TaskController
- Make sure API_URL matches backend URL

### Database errors
- Run: `CREATE DATABASE ProjectSWP391;`
- Update credentials in application.properties

---

## Development Tips

1. **Use DevTools**: Browser React DevTools + Redux DevTools
2. **API Testing**: Use Postman or Insomnia for API testing
3. **Database**: Use SQL Server Management Studio for DB inspection
4. **Logs**: Check browser console and backend logs for errors

---

## Common Tasks

### Add a new page
1. Create component in `src/pages/[Feature]/[Feature]Page.jsx`
2. Import in `src/routes/AppRoutes.jsx`
3. Add route: `<Route path="/path" element={<Component />} />`
4. Update Sidebar navigation if needed

### Add a new API endpoint
1. Create Controller in `backend/.../controller/`
2. Create Service in `backend/.../service/`
3. Create Repository in `backend/.../repository/`
4. Add API service in `src/api/services.js`
5. Use in components

### Add a new model
1. Create Entity in `backend/.../model/`
2. Create Repository interface
3. Create Service class
4. Create Controller with endpoints

---

## Deployment

### Build Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/pims-backend-0.0.1-SNAPSHOT.jar
```

### Build Frontend
```bash
npm run build
# Output in dist/ directory
# Deploy to any static hosting (Vercel, Netlify, etc.)
```

---

## Support & Contact
- Admin Email: trintse180561@fpt.edu.vn
- GitHub: [Project Repo]
- Documentation: See COMPLETE_DOCUMENTATION.md

---

**Happy Coding! 🎉**
