# 🗄️ Database Setup Guide - PIMS Project

## 📋 Overview

File `database_setup.sql` chứa tất cả các script SQL để tạo database hoàn chỉnh với:
- ✅ Database `ProjectSWP391`
- ✅ 3 Tables: `users`, `projects`, `tasks`
- ✅ Relationships & Foreign Keys
- ✅ Indexes cho performance
- ✅ Sample data (Demo accounts, Projects, Tasks)

---

## 🚀 Cách Setup Database

### Option 1: Sử dụng SQL Server Management Studio (Recommended)

#### Bước 1: Mở SQL Server Management Studio
1. Mở **SQL Server Management Studio**
2. Kết nối với SQL Server của bạn
3. Nhập **Server name**: Tên server của bạn (ví dụ: `localhost` hoặc `MSI`)
4. Nhập **Authentication**: Windows hoặc SQL Server Authentication
5. Nhập **Username**: `sa`
6. Nhập **Password**: Mật khẩu của bạn
7. Click **Connect**

#### Bước 2: Chạy Script
1. Trong SQL Server Management Studio, click **File → Open → File**
2. Chọn file `database_setup.sql` từ thư mục project
3. Click **Execute** hoặc bấm **Ctrl+Shift+E**
4. Script sẽ chạy và in ra kết quả

**Kết quả mong đợi:**
```
Database Setup Complete!
================================================
Total Users: 11
Total Projects: 7
Total Tasks: 11
...
```

---

### Option 2: Sử dụng Command Line (sqlcmd)

#### Bước 1: Mở Command Prompt
```bash
# Nhấn Windows + R, gõ cmd, Enter
```

#### Bước 2: Chạy script
```bash
sqlcmd -S localhost -U sa -P your_password -i database_setup.sql
```

**Hoặc nếu dùng Windows Authentication:**
```bash
sqlcmd -S localhost -E -i database_setup.sql
```

---

### Option 3: Sử dụng Visual Studio Code

#### Bước 1: Cài đặt Extension
1. Mở VS Code
2. Nhấn `Ctrl+Shift+X` để mở Extensions
3. Tìm và cài `mssql` extension

#### Bước 2: Kết nối Database
1. Nhấn `Ctrl+Shift+P`
2. Gõ `SQL: Connect`
3. Điền thông tin kết nối:
   - Server: `localhost`
   - Database: `master`
   - Authentication: `Sql Login`
   - Username: `sa`
   - Password: [Your password]

#### Bước 3: Chạy Script
1. Mở file `database_setup.sql`
2. Nhấn `Ctrl+Shift+E` để thực thi
3. Xem kết quả trong Output panel

---

## ⚙️ Cấu hình Application (Spring Boot)

Cập nhật file `backend/src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:sqlserver://localhost;databaseName=ProjectSWP391;encrypt=false
spring.datasource.username=sa
spring.datasource.password=your_password
spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect

# Application Name
spring.application.name=pims-backend
```

**Thay thế:**
- `localhost` → Tên server SQL Server của bạn (ví dụ: `MSI`, `DESKTOP-ABC123`)
- `your_password` → Mật khẩu SQL Server của bạn

---

## 📊 Database Structure

### Table: users
```
┌──────────────────────────────────────┐
│ Column           │ Type     │ Notes  │
├──────────────────────────────────────┤
│ id               │ BIGINT   │ PK    │
│ username         │ NVARCHAR │ UNIQUE│
│ password         │ NVARCHAR │       │
│ role             │ NVARCHAR │       │
│ approved         │ BIT      │       │
│ profile_complete │ BIT      │       │
│ full_name        │ NVARCHAR │       │
│ phone            │ NVARCHAR │       │
│ department       │ NVARCHAR │       │
│ created_at       │ DATETIME │       │
│ updated_at       │ DATETIME │       │
└──────────────────────────────────────┘
```

### Table: projects
```
┌──────────────────────────────────────┐
│ Column       │ Type       │ Notes    │
├──────────────────────────────────────┤
│ id           │ BIGINT     │ PK       │
│ name         │ NVARCHAR   │          │
│ description  │ NVARCHAR   │          │
│ status       │ NVARCHAR   │          │
│ start_date   │ DATETIME   │          │
│ end_date     │ DATETIME   │          │
│ group_id     │ NVARCHAR   │          │
│ mentor_id    │ BIGINT     │ FK Users │
│ progress     │ INT        │ 0-100    │
│ created_at   │ DATETIME   │          │
│ updated_at   │ DATETIME   │          │
└──────────────────────────────────────┘
```

### Table: tasks
```
┌──────────────────────────────────────┐
│ Column         │ Type       │ Notes    │
├──────────────────────────────────────┤
│ id             │ BIGINT     │ PK       │
│ title          │ NVARCHAR   │          │
│ description    │ NVARCHAR   │          │
│ status         │ NVARCHAR   │          │
│ priority       │ INT        │ 1,2,3    │
│ project_id     │ BIGINT     │ FK       │
│ assigned_to_id │ BIGINT     │ FK Users │
│ due_date       │ DATETIME   │          │
│ progress       │ INT        │ 0-100    │
│ created_at     │ DATETIME   │          │
│ updated_at     │ DATETIME   │          │
└──────────────────────────────────────┘
```

---

## 🔐 Sample Data - Login Credentials

### Admin Account
```
Email: admin@fpt.edu.vn
Password: admin123
Role: Admin
Status: Approved
```

### Mentor Accounts
```
Email: mentor@fpt.edu.vn
Password: mentor123
Role: Mentor
Status: Approved

Email: mentor2@fpt.edu.vn
Password: mentor123
Role: Mentor
Status: Approved

Email: mentor3@fpt.edu.vn
Password: mentor123
Role: Mentor
Status: Approved
```

### Committee Accounts
```
Email: committee@fpt.edu.vn
Password: committee123
Role: Committee
Status: Approved

Email: committee2@fpt.edu.vn
Password: committee123
Role: Committee
Status: Approved
```

### Student Accounts
```
Email: student@fpt.edu.vn
Password: student123
Role: Student
Status: Approved

Email: student2@fpt.edu.vn to student8@fpt.edu.vn
Password: student123
Role: Student
Status: Approved
```

---

## 📊 Sample Data Included

### Users
- **1 Admin** - Full system access
- **3 Mentors** - Project management
- **2 Committee Members** - Oversight
- **8 Students** - Learners

### Projects
- **7 Sample Projects**:
  1. SmartTeam PIMS (85% progress)
  2. EcoTrack Mobile (100% completed)
  3. EduChain Ledger (30% on hold)
  4. AI Assistant Bot (65% in progress)
  5. Game of Learning (15% planning)
  6. Data Analytics Dashboard (72%)
  7. Social Network Platform (55%)

### Tasks
- **11 Sample Tasks** with:
  - Different statuses (To Do, In Progress, In Review, Completed)
  - Different priorities (Low, Medium, High)
  - Assigned to various students
  - Various completion percentages

---

## ✅ Verification Checklist

Sau khi chạy script, kiểm tra:

- [ ] Database `ProjectSWP391` được tạo
- [ ] 3 tables: `users`, `projects`, `tasks`
- [ ] 11 users được tạo (1 admin, 3 mentors, 2 committee, 8 students)
- [ ] 7 projects được tạo
- [ ] 11 tasks được tạo
- [ ] Indexes được tạo (performance optimization)
- [ ] Foreign keys được thiết lập đúng

**Kiểm tra bằng SQL:**
```sql
-- View all users
SELECT * FROM users;

-- View all projects
SELECT * FROM projects;

-- View all tasks
SELECT * FROM tasks;

-- Check row counts
SELECT 'Users' AS Table_Name, COUNT(*) AS Row_Count FROM users
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks;
```

---

## 🔧 Troubleshooting

### Lỗi: Database not found
**Giải pháp:** 
- Đảm bảo kết nối SQL Server thành công
- Chạy script trên `master` database

### Lỗi: Login failed
**Giải pháp:**
- Kiểm tra username/password
- Kiểm tra server name
- Thử dùng Windows Authentication

### Lỗi: Table already exists
**Giải pháp:**
- Script kiểm tra bảng đã tồn tại, nếu có sẽ bỏ qua
- Nếu muốn reset: drop database & chạy lại script

### Lỗi: Cannot insert data
**Giải pháp:**
- Đảm bảo primary keys chưa tồn tại
- Xóa sample data trước khi chạy lại

---

## 📝 Reset Database

Nếu muốn xóa tất cả data và tạo lại:

```sql
USE master;
GO

-- Drop database
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'ProjectSWP391')
BEGIN
    ALTER DATABASE ProjectSWP391 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ProjectSWP391;
END
GO

-- Then run database_setup.sql again
```

---

## 🎓 Next Steps

1. ✅ Run `database_setup.sql`
2. ✅ Update `application.properties` with correct credentials
3. ✅ Start backend: `mvn spring-boot:run`
4. ✅ Start frontend: `npm run dev`
5. ✅ Login dengan demo account

---

## 📞 Support

- Check SQL Server error logs if issues occur
- Verify SQL Server is running
- Check firewall settings
- Ensure SQL Server TCP/IP protocol is enabled

---

**Created**: June 3, 2026  
**Version**: 1.0  
**Status**: ✅ Ready to Use
