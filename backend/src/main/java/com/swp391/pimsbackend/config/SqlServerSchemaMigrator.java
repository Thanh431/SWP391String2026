package com.swp391.pimsbackend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Aligns legacy ProjectSWP391 tables (from database_setup.sql) with current JPA entities
 * before DataInitializer runs.
 */
@Component
@Profile("sqlserver")
@Order(0)
public class SqlServerSchemaMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SqlServerSchemaMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public SqlServerSchemaMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("Running SQL Server schema migration for ProjectSWP391...");
        addIntColumnIfMissing("student_groups", "progress", 0);
        addIntColumnIfMissing("student_groups", "milestone_done", 0);
        addIntColumnIfMissing("student_groups", "milestone_total", 4);
        addColumnIfMissing("submissions", "mentor_score", "FLOAT NULL");
        backfillStudentGroupSemester();
        log.info("SQL Server schema migration completed.");
    }

    private void backfillStudentGroupSemester() {
        try {
            jdbcTemplate.update("""
                UPDATE sg
                SET semester_id = (SELECT TOP 1 id FROM semesters ORDER BY start_date DESC)
                FROM student_groups sg
                WHERE sg.semester_id IS NULL
                  AND EXISTS (SELECT 1 FROM semesters)
                """);
            jdbcTemplate.update("""
                UPDATE student_groups
                SET status = 'Recruiting'
                WHERE status IS NULL OR LTRIM(RTRIM(status)) = ''
                """);
        } catch (Exception ex) {
            log.warn("Could not backfill student_groups legacy columns: {}", ex.getMessage());
        }
    }

    private void addIntColumnIfMissing(String table, String column, int defaultValue) {
        if (columnExists(table, column)) {
            return;
        }
        String sql = String.format(
                "ALTER TABLE %s ADD %s INT NOT NULL CONSTRAINT DF_%s_%s DEFAULT %d",
                table, column, table, column, defaultValue
        );
        try {
            jdbcTemplate.execute(sql);
            log.info("Added column {}.{}", table, column);
        } catch (Exception ex) {
            log.warn("Could not add {}.{}: {}", table, column, ex.getMessage());
        }
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (columnExists(table, column)) {
            return;
        }
        String sql = String.format("ALTER TABLE %s ADD %s %s", table, column, definition);
        try {
            jdbcTemplate.execute(sql);
            log.info("Added column {}.{}", table, column);
        } catch (Exception ex) {
            log.warn("Could not add {}.{}: {}", table, column, ex.getMessage());
        }
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                table,
                column
        );
        return count != null && count > 0;
    }
}
