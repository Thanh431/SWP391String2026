-- Minimal bootstrap for SQL Server.
-- Run once in SSMS or sqlcmd before starting backend with profile "sqlserver".
-- Hibernate ddl-auto=update will create/update all tables automatically.

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'ProjectSWP391')
BEGIN
    CREATE DATABASE ProjectSWP391;
    PRINT 'Database ProjectSWP391 created.';
END
ELSE
BEGIN
    PRINT 'Database ProjectSWP391 already exists.';
END
GO
