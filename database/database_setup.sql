-- =====================================================
-- PIMS - Project Information Management System
-- Database Setup Script for SQL Server
-- Created: June 3, 2026
-- =====================================================

-- Step 1: Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ProjectSWP391')
BEGIN
    CREATE DATABASE ProjectSWP391;
END
GO

-- Step 2: Use the database
USE ProjectSWP391;
GO

-- Step 3: Create Tables

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL,
        approved BIT NOT NULL DEFAULT 0,
        profile_complete BIT NOT NULL DEFAULT 0,
        full_name NVARCHAR(255),
        phone NVARCHAR(20),
        department NVARCHAR(255),
        class_name NVARCHAR(100),
        semester NVARCHAR(100),
        campus NVARCHAR(255),
        avatar_url NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_users_username ON users(username);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_approved ON users(approved);
    PRINT 'Table users created successfully';
END
ELSE
BEGIN
    PRINT 'Table users already exists';
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'class_name')
    BEGIN
        ALTER TABLE users ADD class_name NVARCHAR(100);
        PRINT 'Column class_name added to users table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'semester')
    BEGIN
        ALTER TABLE users ADD semester NVARCHAR(100);
        PRINT 'Column semester added to users table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'campus')
    BEGIN
        ALTER TABLE users ADD campus NVARCHAR(255);
        PRINT 'Column campus added to users table';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'avatar_url')
    BEGIN
        ALTER TABLE users ADD avatar_url NVARCHAR(MAX);
        PRINT 'Column avatar_url added to users table';
    END
END
GO

-- Projects Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
BEGIN
    CREATE TABLE projects (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(50) NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME,
        group_id NVARCHAR(50) NOT NULL,
        mentor_id BIGINT,
        progress INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_projects_group_id ON projects(group_id);
    CREATE INDEX idx_projects_status ON projects(status);
    CREATE INDEX idx_projects_mentor_id ON projects(mentor_id);
    PRINT 'Table projects created successfully';
END
ELSE
BEGIN
    PRINT 'Table projects already exists';
END
GO

-- Tasks Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
BEGIN
    CREATE TABLE tasks (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        status NVARCHAR(50) NOT NULL,
        priority INT NOT NULL,
        project_id BIGINT NOT NULL,
        assigned_to_id BIGINT,
        due_date DATETIME NOT NULL,
        progress INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_assigned_to_id ON tasks(assigned_to_id);
    PRINT 'Table tasks created successfully';
END
ELSE
BEGIN
    PRINT 'Table tasks already exists';
END
GO

-- Semesters Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'semesters')
BEGIN
    CREATE TABLE semesters (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status NVARCHAR(50) NOT NULL, -- "Active", "Completed", "Planning"
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_semesters_code ON semesters(code);
    CREATE INDEX idx_semesters_status ON semesters(status);
    PRINT 'Table semesters created successfully';
END
ELSE
BEGIN
    PRINT 'Table semesters already exists';
END
GO

-- Notifications Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    PRINT 'Table notifications created successfully';
END
ELSE
BEGIN
    PRINT 'Table notifications already exists';
END
GO

-- Student Groups Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'student_groups')
BEGIN
    CREATE TABLE student_groups (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        group_code NVARCHAR(50) NOT NULL UNIQUE,
        group_name NVARCHAR(255) NOT NULL,
        semester_id BIGINT NOT NULL,
        mentor_id BIGINT,
        description NVARCHAR(MAX),
        max_members INT DEFAULT 5,
        status NVARCHAR(50) NOT NULL, -- "Active", "Completed", "On Hold"
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_groups_code ON student_groups(group_code);
    CREATE INDEX idx_groups_semester ON student_groups(semester_id);
    CREATE INDEX idx_groups_mentor ON student_groups(mentor_id);
    PRINT 'Table student_groups created successfully';
END
ELSE
BEGIN
    PRINT 'Table student_groups already exists';
END
GO

-- Group Members Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'group_members')
BEGIN
    CREATE TABLE group_members (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        group_id BIGINT NOT NULL,
        student_id BIGINT NOT NULL,
        role NVARCHAR(50) DEFAULT 'Member', -- "Leader", "Member"
        status NVARCHAR(50) NOT NULL, -- "Active", "Inactive", "Removed"
        joined_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (group_id, student_id)
    );
    
    CREATE INDEX idx_members_group ON group_members(group_id);
    CREATE INDEX idx_members_student ON group_members(student_id);
    PRINT 'Table group_members created successfully';
END
ELSE
BEGIN
    PRINT 'Table group_members already exists';
END
GO

-- Defense Schedule Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'defense_schedules')
BEGIN
    CREATE TABLE defense_schedules (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        group_id BIGINT NOT NULL,
        project_id BIGINT,
        defense_date DATETIME NOT NULL,
        defense_location NVARCHAR(255),
        examiner_id BIGINT,
        committee_id BIGINT,
        status NVARCHAR(50) NOT NULL, -- "Scheduled", "In Progress", "Completed", "Rescheduled"
        notes NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (committee_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_defense_group ON defense_schedules(group_id);
    CREATE INDEX idx_defense_date ON defense_schedules(defense_date);
    CREATE INDEX idx_defense_status ON defense_schedules(status);
    PRINT 'Table defense_schedules created successfully';
END
ELSE
BEGIN
    PRINT 'Table defense_schedules already exists';
END
GO

-- Evaluations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'evaluations')
BEGIN
    CREATE TABLE evaluations (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        defense_id BIGINT NOT NULL,
        group_id BIGINT NOT NULL,
        evaluator_id BIGINT NOT NULL,
        technical_score FLOAT,
        presentation_score FLOAT,
        innovation_score FLOAT,
        overall_score FLOAT,
        feedback NVARCHAR(MAX),
        recommendation NVARCHAR(50), -- "Pass", "Conditional Pass", "Fail"
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (defense_id) REFERENCES defense_schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    CREATE INDEX idx_eval_defense ON evaluations(defense_id);
    CREATE INDEX idx_eval_group ON evaluations(group_id);
    CREATE INDEX idx_eval_evaluator ON evaluations(evaluator_id);
    PRINT 'Table evaluations created successfully';
END
ELSE
BEGIN
    PRINT 'Table evaluations already exists';
END
GO

-- Step 4: Insert Sample Data

-- Insert Admin User
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin@fpt.edu.vn')
BEGIN
    INSERT INTO users (username, password, role, approved, profile_complete, full_name, phone, department)
    VALUES ('admin@fpt.edu.vn', 'admin123', 'Admin', 1, 1, 'Admin User', '0123456789', 'IT');
    PRINT 'Admin user created';
END
GO

-- Insert Mentor Users
IF NOT EXISTS (SELECT * FROM users WHERE username = 'mentor@fpt.edu.vn')
BEGIN
    INSERT INTO users (username, password, role, approved, profile_complete, full_name, phone, department)
    VALUES 
    ('mentor@fpt.edu.vn', 'mentor123', 'Mentor', 1, 1, 'Dr. Smith', '0123456780', 'IT'),
    ('mentor2@fpt.edu.vn', 'mentor123', 'Mentor', 1, 1, 'Prof. Johnson', '0123456781', 'Business'),
    ('mentor3@fpt.edu.vn', 'mentor123', 'Mentor', 1, 1, 'Ms. Williams', '0123456782', 'Design');
    PRINT 'Mentor users created';
END
GO

-- Insert Committee Users
IF NOT EXISTS (SELECT * FROM users WHERE username = 'committee@fpt.edu.vn')
BEGIN
    INSERT INTO users (username, password, role, approved, profile_complete, full_name, phone, department)
    VALUES 
    ('committee@fpt.edu.vn', 'committee123', 'Committee', 1, 1, 'Chairman Lee', '0123456783', 'Administration'),
    ('committee2@fpt.edu.vn', 'committee123', 'Committee', 1, 1, 'Vice Dean', '0123456784', 'Academic');
    PRINT 'Committee users created';
END
GO

-- Insert Student Users
IF NOT EXISTS (SELECT * FROM users WHERE username = 'student@fpt.edu.vn')
BEGIN
    INSERT INTO users (username, password, role, approved, profile_complete, full_name, phone, department)
    VALUES 
    ('student@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Nguyễn Văn A', '0987654321', 'IT'),
    ('student2@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Trần Thị B', '0987654322', 'IT'),
    ('student3@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Phạm Văn C', '0987654323', 'Business'),
    ('student4@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Hoàng Thị D', '0987654324', 'IT'),
    ('student5@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Võ Văn E', '0987654325', 'IT'),
    ('student6@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Lê Thị F', '0987654326', 'Business'),
    ('student7@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Đặng Văn G', '0987654327', 'Design'),
    ('student8@fpt.edu.vn', 'student123', 'Student', 1, 1, 'Tạ Thị H', '0987654328', 'IT');
    PRINT 'Student users created';
END
GO

-- Insert Sample Semesters
IF NOT EXISTS (SELECT * FROM semesters WHERE code = 'FA2024')
BEGIN
    INSERT INTO semesters (code, name, description, start_date, end_date, status)
    VALUES 
    ('FA2024', 'Fall 2024', 'Fall Semester 2024', '2024-09-01', '2024-12-31', 'Active'),
    ('SP2025', 'Spring 2025', 'Spring Semester 2025', '2025-01-01', '2025-05-31', 'Active'),
    ('SU2024', 'Summer 2024', 'Summer Semester 2024', '2024-06-01', '2024-08-31', 'Completed');
    PRINT 'Sample semesters created';
END
GO

-- Insert Sample Student Groups
IF NOT EXISTS (SELECT * FROM student_groups WHERE group_code = 'SE1701')
BEGIN
    INSERT INTO student_groups (group_code, group_name, semester_id, mentor_id, description, max_members, status)
    VALUES 
    ('SE1701', 'SmartTeam PIMS Group 1', (SELECT id FROM semesters WHERE code = 'FA2024'), 
     (SELECT id FROM users WHERE username = 'mentor@fpt.edu.vn'), 
     'Project Information Management System Development Group', 5, 'Active'),
    ('SE1702', 'SmartTeam PIMS Group 2', (SELECT id FROM semesters WHERE code = 'FA2024'),
     (SELECT id FROM users WHERE username = 'mentor2@fpt.edu.vn'),
     'Project Information Management System Maintenance Group', 5, 'Active'),
    ('SE1704', 'EcoTrack Mobile Team', (SELECT id FROM semesters WHERE code = 'FA2024'),
     (SELECT id FROM users WHERE username = 'mentor3@fpt.edu.vn'),
     'Environmental Tracking Mobile App Development', 4, 'Active');
    PRINT 'Sample student groups created';
END
GO

-- Insert Sample Group Members
IF NOT EXISTS (SELECT * FROM group_members WHERE group_id = (SELECT id FROM student_groups WHERE group_code = 'SE1701') AND student_id = (SELECT id FROM users WHERE username = 'student@fpt.edu.vn'))
BEGIN
    INSERT INTO group_members (group_id, student_id, role, status)
    VALUES 
    -- Group SE1701
    ((SELECT id FROM student_groups WHERE group_code = 'SE1701'), 
     (SELECT id FROM users WHERE username = 'student@fpt.edu.vn'), 'Leader', 'Active'),
    ((SELECT id FROM student_groups WHERE group_code = 'SE1701'),
     (SELECT id FROM users WHERE username = 'student2@fpt.edu.vn'), 'Member', 'Active'),
    ((SELECT id FROM student_groups WHERE group_code = 'SE1701'),
     (SELECT id FROM users WHERE username = 'student4@fpt.edu.vn'), 'Member', 'Active'),
    ((SELECT id FROM student_groups WHERE group_code = 'SE1701'),
     (SELECT id FROM users WHERE username = 'student5@fpt.edu.vn'), 'Member', 'Active'),
    
    -- Group SE1702
    ((SELECT id FROM student_groups WHERE group_code = 'SE1702'),
     (SELECT id FROM users WHERE username = 'student3@fpt.edu.vn'), 'Leader', 'Active'),
    ((SELECT id FROM student_groups WHERE group_code = 'SE1702'),
     (SELECT id FROM users WHERE username = 'student6@fpt.edu.vn'), 'Member', 'Active'),
    ((SELECT id FROM student_groups WHERE group_code = 'SE1702'),
     (SELECT id FROM users WHERE username = 'student7@fpt.edu.vn'), 'Member', 'Active'),
    
    -- Group SE1704
    ((SELECT id FROM student_groups WHERE group_code = 'SE1704'),
     (SELECT id FROM users WHERE username = 'student8@fpt.edu.vn'), 'Leader', 'Active');
    
    PRINT 'Sample group members created';
END
GO

-- Insert Sample Defense Schedules
IF NOT EXISTS (SELECT * FROM defense_schedules WHERE group_id = (SELECT id FROM student_groups WHERE group_code = 'SE1701'))
BEGIN
    INSERT INTO defense_schedules (group_id, project_id, defense_date, defense_location, examiner_id, committee_id, status, notes)
    VALUES 
    ((SELECT id FROM student_groups WHERE group_code = 'SE1701'),
     (SELECT id FROM projects WHERE group_id = 'SE1701' LIMIT 1),
     '2024-12-15 09:00:00', 'Room 301 - Building A',
     (SELECT id FROM users WHERE username = 'mentor@fpt.edu.vn'),
     (SELECT id FROM users WHERE username = 'committee@fpt.edu.vn'),
     'Scheduled', 'Final defense for SmartTeam PIMS Project'),
    
    ((SELECT id FROM student_groups WHERE group_code = 'SE1702'),
     (SELECT id FROM projects WHERE group_id = 'SE1702' LIMIT 1),
     '2024-12-16 10:00:00', 'Room 302 - Building A',
     (SELECT id FROM users WHERE username = 'mentor2@fpt.edu.vn'),
     (SELECT id FROM users WHERE username = 'committee2@fpt.edu.vn'),
     'Scheduled', 'Mid-term defense'),
    
    ((SELECT id FROM student_groups WHERE group_code = 'SE1704'),
     (SELECT id FROM projects WHERE group_id = 'SE1704' LIMIT 1),
     '2024-12-17 14:00:00', 'Room 401 - Building B',
     (SELECT id FROM users WHERE username = 'mentor3@fpt.edu.vn'),
     (SELECT id FROM users WHERE username = 'committee@fpt.edu.vn'),
     'Scheduled', 'EcoTrack Mobile App Final Defense');
    
    PRINT 'Sample defense schedules created';
END
GO

-- Insert Sample Evaluations
IF NOT EXISTS (SELECT * FROM evaluations WHERE defense_id = (SELECT TOP 1 id FROM defense_schedules))
BEGIN
    DECLARE @defense1_id BIGINT = (SELECT TOP 1 id FROM defense_schedules ORDER BY id);
    
    INSERT INTO evaluations (defense_id, group_id, evaluator_id, technical_score, presentation_score, innovation_score, overall_score, feedback, recommendation)
    VALUES 
    (@defense1_id,
     (SELECT id FROM student_groups WHERE group_code = 'SE1701'),
     (SELECT id FROM users WHERE username = 'committee@fpt.edu.vn'),
     8.5, 8.0, 8.5, 8.3, 'Excellent project with good technical implementation', 'Pass');
    
    PRINT 'Sample evaluations created';
END
GO

-- Insert Sample Projects
IF NOT EXISTS (SELECT * FROM projects WHERE group_id = 'SE1701')
BEGIN
    INSERT INTO projects (name, description, status, start_date, end_date, group_id, mentor_id, progress)
    VALUES 
    ('SmartTeam PIMS', 'Project Information Management System for FPT University', 'In Progress', 
     '2024-01-01', '2024-06-30', 'SE1701', 
     (SELECT id FROM users WHERE username = 'mentor@fpt.edu.vn'), 85),
    
    ('EcoTrack Mobile', 'Environmental tracking mobile application', 'Completed', 
     '2024-01-01', '2024-05-30', 'SE1704', 
     (SELECT id FROM users WHERE username = 'mentor2@fpt.edu.vn'), 100),
    
    ('EduChain Ledger', 'Educational blockchain system for credential verification', 'On Hold', 
     '2024-02-01', '2024-08-31', 'IA1501', 
     (SELECT id FROM users WHERE username = 'mentor@fpt.edu.vn'), 30),
    
    ('AI Assistant Bot', 'Intelligent chatbot for customer service', 'In Progress', 
     '2024-03-01', '2024-07-31', 'AI1604', 
     (SELECT id FROM users WHERE username = 'mentor3@fpt.edu.vn'), 65),
    
    ('Game of Learning', 'Educational game platform', 'Planning', 
     '2024-04-01', '2024-09-30', 'GD1705', 
     (SELECT id FROM users WHERE username = 'mentor2@fpt.edu.vn'), 15),
    
    ('Data Analytics Dashboard', 'Real-time analytics dashboard', 'In Progress', 
     '2024-02-15', '2024-07-15', 'SE1702', 
     (SELECT id FROM users WHERE username = 'mentor@fpt.edu.vn'), 72),
    
    ('Social Network Platform', 'Community-based social network', 'In Progress', 
     '2024-03-15', '2024-08-15', 'SE1703', 
     (SELECT id FROM users WHERE username = 'mentor3@fpt.edu.vn'), 55);
    
    PRINT 'Sample projects created';
END
GO

-- Insert Sample Tasks for each Project
IF NOT EXISTS (SELECT * FROM tasks WHERE title = 'Setup project infrastructure')
BEGIN
    DECLARE @project1_id BIGINT = (SELECT id FROM projects WHERE group_id = 'SE1701' LIMIT 1);
    DECLARE @project2_id BIGINT = (SELECT id FROM projects WHERE group_id = 'SE1704' LIMIT 1);
    DECLARE @project3_id BIGINT = (SELECT id FROM projects WHERE group_id = 'IA1501' LIMIT 1);
    
    DECLARE @student1_id BIGINT = (SELECT id FROM users WHERE username = 'student@fpt.edu.vn');
    DECLARE @student2_id BIGINT = (SELECT id FROM users WHERE username = 'student2@fpt.edu.vn');
    DECLARE @student3_id BIGINT = (SELECT id FROM users WHERE username = 'student3@fpt.edu.vn');
    DECLARE @student4_id BIGINT = (SELECT id FROM users WHERE username = 'student4@fpt.edu.vn');
    
    -- Tasks for Project 1 (SE1701)
    INSERT INTO tasks (title, description, status, priority, project_id, assigned_to_id, due_date, progress)
    VALUES 
    ('Setup project infrastructure', 'Initialize repository and project structure', 'Completed', 3, @project1_id, @student1_id, '2024-02-01', 100),
    ('Design database schema', 'Create database design and entity relationship diagram', 'Completed', 3, @project1_id, @student2_id, '2024-02-15', 100),
    ('Implement authentication module', 'Build user login and registration system', 'In Progress', 3, @project1_id, @student1_id, '2024-04-01', 90),
    ('Create dashboard UI', 'Design and implement dashboard interface', 'In Review', 2, @project1_id, @student3_id, '2024-05-01', 85),
    ('Setup testing environment', 'Configure unit and integration tests', 'To Do', 2, @project1_id, @student4_id, '2024-06-01', 0),
    ('API documentation', 'Write comprehensive API documentation', 'In Progress', 1, @project1_id, @student2_id, '2024-06-15', 60);
    
    -- Tasks for Project 2 (SE1704)
    INSERT INTO tasks (title, description, status, priority, project_id, assigned_to_id, due_date, progress)
    VALUES 
    ('Mobile app development', 'Build iOS/Android application', 'Completed', 3, @project2_id, @student1_id, '2024-04-15', 100),
    ('User testing', 'Conduct user acceptance testing', 'Completed', 2, @project2_id, @student2_id, '2024-05-15', 100),
    ('Deployment preparation', 'Prepare for app store submission', 'Completed', 2, @project2_id, @student3_id, '2024-05-30', 100);
    
    -- Tasks for Project 3 (IA1501)
    INSERT INTO tasks (title, description, status, priority, project_id, assigned_to_id, due_date, progress)
    VALUES 
    ('Research blockchain technology', 'Study blockchain implementation', 'To Do', 3, @project3_id, @student4_id, '2024-05-01', 0),
    ('Design system architecture', 'Plan system design and components', 'To Do', 3, @project3_id, @student1_id, '2024-06-01', 0);
    
    PRINT 'Sample tasks created';
END
GO

-- Step 5: Display Summary Statistics
PRINT '================================================';
PRINT 'Database Setup Complete!';
PRINT '================================================';

SELECT 'Total Users: ' + CAST(COUNT(*) AS NVARCHAR) FROM users;
SELECT 'Total Projects: ' + CAST(COUNT(*) AS NVARCHAR) FROM projects;
SELECT 'Total Tasks: ' + CAST(COUNT(*) AS NVARCHAR) FROM tasks;

PRINT '';
PRINT 'User Summary:';
SELECT role, COUNT(*) AS count FROM users GROUP BY role;

PRINT '';
PRINT 'Project Status Summary:';
SELECT status, COUNT(*) AS count FROM projects GROUP BY status;

PRINT '';
PRINT 'Task Status Summary:';
SELECT status, COUNT(*) AS count FROM tasks GROUP BY status;

PRINT '';
PRINT '================================================';
PRINT 'Sample Login Credentials:';
PRINT '================================================';
PRINT 'Admin: admin@fpt.edu.vn / admin123';
PRINT 'Mentor: mentor@fpt.edu.vn / mentor123';
PRINT 'Committee: committee@fpt.edu.vn / committee123';
PRINT 'Student: student@fpt.edu.vn / student123';
PRINT '================================================';

GO
