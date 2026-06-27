package com.swp391.pimsbackend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("h2")
public class DatabaseSchemaPatch {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaPatch.class);

    private final JdbcTemplate jdbcTemplate;
    private boolean applied;

    public DatabaseSchemaPatch(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void widenAvatarColumn() {
        if (applied) {
            return;
        }

        String[] statements = {
                "ALTER TABLE users ALTER COLUMN avatar_url SET DATA TYPE CLOB",
                "ALTER TABLE users ALTER COLUMN avatar_url CLOB",
                "ALTER TABLE users ALTER COLUMN avatar_url CHARACTER LARGE OBJECT",
        };

        for (String sql : statements) {
            try {
                jdbcTemplate.execute(sql);
                log.info("DatabaseSchemaPatch applied: {}", sql);
                applied = true;
                return;
            } catch (Exception ex) {
                log.debug("DatabaseSchemaPatch skipped ({}): {}", sql, ex.getMessage());
            }
        }

        log.warn("Could not widen users.avatar_url — run manually in H2 Console: ALTER TABLE users ALTER COLUMN avatar_url SET DATA TYPE CLOB");
    }
}
