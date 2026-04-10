# WP Backups & Recovery

> Configure UpdraftPlus, WP-CLI backups, and disaster recovery procedures

## What This Skill Covers

- Automating full-site backups with UpdraftPlus schedules
- Running database and file backups via WP-CLI
- Setting up offsite backup storage (S3, Google Drive, Dropbox)
- Disaster recovery workflows and database restoration

## Example Usage

Ask your AI assistant:

```
> "Set up an automated daily database backup with WP-CLI on wordpress.test"
```

### Example Output

```bash
# Export the database
wp db export /backups/wordpress-test-$(date +%Y%m%d).sql --path=/var/www/wordpress.test

# Compress the backup
gzip /backups/wordpress-test-$(date +%Y%m%d).sql

# Add to crontab for daily execution at 3 AM
# 0 3 * * * wp db export /backups/wordpress-test-$(date +\%Y\%m\%d).sql --path=/var/www/wordpress.test && gzip /backups/wordpress-test-$(date +\%Y\%m\%d).sql

# Prune backups older than 30 days
find /backups/ -name "wordpress-test-*.sql.gz" -mtime +30 -delete

# Verify backup integrity
gunzip -t /backups/wordpress-test-$(date +%Y%m%d).sql.gz && echo "Backup OK"
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_wp_cli` | Executes WP-CLI backup and export commands |
| `analyze_database` | Checks database size and tables before backup |
| `validate_config` | Verifies wp-config.php database credentials |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
