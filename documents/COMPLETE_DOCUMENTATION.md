# PIMS - Project Information Management System
## SmartTeam Academic Project Management Platform

Một hệ thống quản lý dự án học tập toàn diện cho FPT University, giúp quản lý các dự án khóa học, công việc, nhóm học tập, và tiến độ học tập.

---

## 📋 Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [API Documentation](#api-documentation)
- [Sử dụng hệ thống](#sử-dụng-hệ-thống)
- [Vai trò người dùng](#vai-trò-người-dùng)

---

## 🎯 Tính năng chính

### Quản lý Xác thực (Authentication)
- ✅ Đăng nhập/Đăng xuất với email FPT (@fpt.edu.vn)
- ✅ Đăng ký tài khoản học viên
- ✅ Hoàn thiện hồ sơ sau đăng ký
- ✅ Duyệt tài khoản (Admin)
- ✅ 4 vai trò: Student, Mentor, Committee, Admin

### Quản lý Dự án
- ✅ Tạo, sửa, xóa dự án
- ✅ Theo dõi trạng thái dự án (Planning, In Progress, Completed, On Hold)
- ✅ Cập nhật tiến độ dự án (0-100%)
- ✅ Gán mentor cho dự án
- ✅ Phân loại theo nhóm học tập

### Quản lý Công việc
- ✅ Tạo, sửa, xóa công việc
- ✅ Đặt ưu tiên (Thấp, Trung bình, Cao)
- ✅ Gán công việc cho thành viên
- ✅ Theo dõi trạng thái (To Do, In Progress, In Review, Completed)
- ✅ Cập nhật tiến độ công việc

### Dashboard & Báo cáo
- ✅ Thống kê tổng quan
- ✅ Biểu đồ trạng thái dự án
- ✅ Biểu đồ tiến độ nhóm
- ✅ Bảng dự án gần đây
- ✅ Xuất báo cáo

### Quản lý Thành viên
- ✅ Xem danh sách thành viên
- ✅ Lọc theo vai trò
- ✅ Xem thông tin chi tiết
- ✅ Quản lý phê duyệt (Admin)

---

## 💻 Công nghệ sử dụng

### Backend
- **Framework**: Spring Boot 3.3.3
- **Database**: Microsoft SQL Server
- **ORM**: JPA/Hibernate
- **Java Version**: 17
- **Build Tool**: Maven

### Frontend
- **Framework**: React 19.2.6
- **UI Library**: React Bootstrap 2.10.10
- **Routing**: React Router DOM 7.16.0
- **HTTP Client**: Axios 1.16.1
- **Charts**: Recharts 3.8.1
- **Icons**: React Icons 5.6.0
- **Build Tool**: Vite 8.0.12

---

## 📁 Cấu trúc dự án

```
SWP391_PIMS-main/
├── backend/
│   ├── src/main/java/com/swp391/pimsbackend/
│   │   ├── controller/
│   │   │   ├── AuthController.java          # Xác thực
│   │   │   ├── ProjectController.java       # Dự án
│   │   │   ├── TaskController.java          # Công việc
│   │   │   ├── UserController.java          # Người dùng
│   │   │   └── DashboardController.java     # Dashboard
│   │   ├── model/
│   │   │   ├── User.java                    # Người dùng
│   │   │   ├── Project.java                 # Dự án
│   │   │   └── Task.java                    # Công việc
│   │   ├── service/
│   │   │   ├── UserService.java
│   │   │   ├── ProjectService.java
│   │   │   └── TaskService.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── ProjectRepository.java
│   │   │   └── TaskRepository.java
│   │   ├── PimsBackendApplication.java
│   │   └── DataInitializer.java
│   └── src/main/resources/
│       └── application.properties
├── src/
│   ├── api/
│   │   ├── api.js                           # Axios instance
│   │   └── services.js                      # API services
│   ├── auth/
│   │   └── AuthContext.jsx                  # Auth state management
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   └── dashboard/
│   │       ├── StatCard.jsx
│   │       ├── ProjectStatusChart.jsx
│   │       ├── GroupProgressChart.jsx
│   │       └── RecentProjectsTable.jsx
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Profile/
│   │   ├── Settings/
│   │   ├── Projects/
│   │   ├── Tasks/
│   │   └── Members/
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js 18+ (Frontend)
- Java 17+ (Backend)
- Maven 3.8+ (Backend)
- SQL Server 2019+ (Database)

### Setup Backend

#### 1. Tạo Database
```sql
CREATE DATABASE ProjectSWP391;
```

#### 2. Cấu hình kết nối
File: `backend/src/main/resources/application.properties`

```properties
# Database Configuration
spring.datasource.url=jdbc:sqlserver://SERVER_NAME;databaseName=ProjectSWP391;encrypt=false
spring.datasource.username=sa
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
```

#### 3. Build và chạy
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### Setup Frontend

#### 1. Cài đặt dependencies
```bash
npm install
```

#### 2. Cấu hình environment
Tạo file `.env` từ `.env.example`:
```
VITE_API_URL=http://localhost:8080/api
```

#### 3. Chạy development server
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

#### 4. Build production
```bash
npm run build
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "student@fpt.edu.vn",
  "password": "password",
  "role": "Student"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "student@fpt.edu.vn",
  "role": "Student",
  "approved": true,
  "profileComplete": false,
  "fullName": null,
  "phone": null,
  "department": null
}
```

#### Register (Student Only)
```http
POST /auth/register
Content-Type: application/json

{
  "username": "newstudent@fpt.edu.vn",
  "password": "password",
  "role": "Student"
}
```

#### Complete Profile
```http
PUT /auth/profile
Content-Type: application/json

{
  "username": "student@fpt.edu.vn",
  "fullName": "Trần Văn A",
  "phone": "0123456789",
  "department": "IT"
}
```

#### Get Pending Accounts
```http
GET /auth/pending
```

#### Approve Account
```http
PUT /auth/approve/{userId}
```

#### Create Account (Admin Only)
```http
POST /auth/create
Content-Type: application/json

{
  "username": "mentor@fpt.edu.vn",
  "password": "password",
  "role": "Mentor"
}
```

### Project Endpoints

#### Get All Projects
```http
GET /projects
```

#### Get Project by ID
```http
GET /projects/{id}
```

#### Get Projects by Group
```http
GET /projects/group/{groupId}
```

#### Get Projects by Status
```http
GET /projects/status/{status}
```

#### Get Projects by Mentor
```http
GET /projects/mentor/{mentorId}
```

#### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "SmartTeam PIMS",
  "description": "Project management system",
  "status": "In Progress",
  "groupId": "SE1701",
  "progress": 85,
  "startDate": "2024-01-01T00:00:00",
  "endDate": "2024-06-30T23:59:59"
}
```

#### Update Project
```http
PUT /projects/{id}
Content-Type: application/json

{
  "name": "SmartTeam PIMS",
  "status": "Completed",
  "progress": 100
}
```

#### Update Project Progress
```http
PUT /projects/{id}/progress
Content-Type: application/json

{
  "progress": 90
}
```

#### Delete Project
```http
DELETE /projects/{id}
```

### Task Endpoints

#### Get All Tasks
```http
GET /tasks
```

#### Get Tasks by Project
```http
GET /tasks/project/{projectId}
```

#### Get Tasks by Project and Status
```http
GET /tasks/project/{projectId}/status/{status}
```

#### Get Tasks Assigned to User
```http
GET /tasks/assigned/{userId}
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add JWT authentication",
  "status": "In Progress",
  "priority": 3,
  "progress": 50,
  "dueDate": "2024-06-30T23:59:59",
  "projectId": 1
}
```

#### Update Task
```http
PUT /tasks/{id}
Content-Type: application/json

{
  "title": "Implement authentication",
  "status": "In Review",
  "progress": 80
}
```

#### Update Task Status
```http
PUT /tasks/{id}/status
Content-Type: application/json

{
  "status": "Completed"
}
```

#### Update Task Progress
```http
PUT /tasks/{id}/progress
Content-Type: application/json

{
  "progress": 100
}
```

#### Delete Task
```http
DELETE /tasks/{id}
```

### User Endpoints

#### Get Users by Role
```http
GET /users/role/{role}
```

#### Get All Mentors
```http
GET /users/mentors
```

#### Get All Students
```http
GET /users/students
```

#### Get All Committee
```http
GET /users/committee
```

#### Get Approved Users
```http
GET /users/approved
```

### Dashboard Endpoints

#### Get Dashboard Statistics
```http
GET /dashboard/stats
```

**Response:**
```json
{
  "totalStudents": 1248,
  "totalMentors": 86,
  "totalCommittee": 12,
  "totalProjects": 284,
  "activeProjects": 170,
  "completedProjects": 71,
  "onHoldProjects": 43,
  "pendingAccounts": 5
}
```

#### Get User Statistics
```http
GET /dashboard/user/{userId}/stats
```

---

## 👥 Vai trò người dùng

### 1. Student (Học viên)
- ✅ Xem dashboard
- ✅ Xem dự án của mình
- ✅ Xem công việc được gán
- ✅ Cập nhật hồ sơ cá nhân
- ❌ Không quản lý dự án/công việc
- ❌ Không duyệt tài khoản

### 2. Mentor (Hướng dẫn viên)
- ✅ Xem dashboard
- ✅ Quản lý dự án
- ✅ Quản lý công việc
- ✅ Gán công việc cho học viên
- ✅ Theo dõi tiến độ
- ❌ Không duyệt tài khoản

### 3. Committee (Ban quản lý)
- ✅ Xem dashboard
- ✅ Xem tất cả dự án
- ✅ Xem tất cả công việc
- ✅ Theo dõi tiến độ
- ❌ Không chỉnh sửa dự án
- ❌ Không duyệt tài khoản

### 4. Admin (Quản trị viên)
- ✅ Xem dashboard
- ✅ Quản lý tất cả dự án/công việc
- ✅ Tạo tài khoản Mentor/Committee
- ✅ Duyệt tài khoản chưa được phê duyệt
- ✅ Xem tất cả người dùng
- ✅ Toàn quyền truy cập

---

## 🎓 Sử dụng hệ thống

### Luồng Login/Register

#### Đối với Student:
1. Nhấn "Đăng ký" trên trang login
2. Nhập email @fpt.edu.vn và mật khẩu
3. Nhấn "Đăng ký"
4. Đăng nhập lại
5. Điền đầy đủ thông tin hồ sơ
6. Truy cập dashboard

#### Đối với Mentor/Committee:
1. Yêu cầu Admin tạo tài khoản
2. Chờ phê duyệt (Admin)
3. Đăng nhập khi được phê duyệt
4. Truy cập dashboard

#### Đối với Admin:
- Đăng nhập trực tiếp
- Không cần phê duyệt hồ sơ

### Quản lý Dự án

1. **Tạo dự án mới**
   - Vào "Projects"
   - Nhấn "Thêm dự án"
   - Điền thông tin
   - Nhấn "Tạo"

2. **Cập nhật tiến độ**
   - Trong bảng Projects
   - Kéo progress bar hoặc nhấn edit
   - Cập nhật tiến độ
   - Lưu

3. **Quản lý công việc**
   - Vào "Tasks"
   - Tạo, sửa, xóa công việc
   - Gán công việc cho thành viên

### Dashboard

- **KPI Cards**: Thống kê tổng quát
- **Biểu đồ**: Trạng thái dự án, tiến độ nhóm
- **Bảng dữ liệu**: Dự án gần đây
- **Xuất báo cáo**: Tạo báo cáo PDF/Excel

---

## 🔐 Tài khoản Demo

| Email | Password | Role | Trạng thái |
|-------|----------|------|-----------|
| admin@fpt.edu.vn | admin123 | Admin | Hoạt động |
| mentor@fpt.edu.vn | mentor123 | Mentor | Cần duyệt |
| student@fpt.edu.vn | student123 | Student | Hoạt động |

---

## 📝 Ghi chú

- Tất cả email phải có đuôi @fpt.edu.vn
- Mật khẩu được lưu plain text (chỉ cho demo)
- Database tự động tạo bảng (JPA auto update)
- CORS được enable cho tất cả origins

---

## 🤝 Hỗ trợ

Liên hệ: trintse180561@fpt.edu.vn

---

**Last Updated**: June 2026
**Version**: 1.0.0
