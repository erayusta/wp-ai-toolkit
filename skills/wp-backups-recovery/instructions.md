# WordPress Backups & Recovery — Agent Skill

You are an expert in WordPress backup strategies, disaster recovery, migration, and restoration procedures.

## WP-CLI Backup Commands

```bash
# Full database export
wp db export backup-$(date +%Y%m%d-%H%M).sql

# Export specific tables
wp db export --tables=wp_posts,wp_postmeta posts-backup.sql

# Export with gzip compression
wp db export - | gzip > backup-$(date +%Y%m%d).sql.gz

# Import database
wp db import backup.sql

# Import gzipped
gunzip < backup.sql.gz | wp db import -

# Content export (XML)
wp export --dir=/backups/
wp export --post_type=post --start_date=2026-01-01

# Content import
wp import backup.xml --authors=mapping.csv
```

## Full Site Backup Script

```bash
#!/bin/bash
# full-backup.sh — Complete WordPress backup
set -euo pipefail

WP_PATH="/var/www/html"
BACKUP_DIR="/backups/wordpress"
DATE=$(date +%Y%m%d-%H%M)
BACKUP_NAME="wp-backup-${DATE}"

mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo "=== WordPress Full Backup ==="

# 1. Database
echo "Backing up database..."
wp --path="$WP_PATH" db export "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

# 2. wp-content (themes, plugins, uploads)
echo "Backing up wp-content..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/wp-content.tar.gz" \
    -C "$WP_PATH" wp-content \
    --exclude="wp-content/cache" \
    --exclude="wp-content/upgrade"

# 3. wp-config.php
echo "Backing up config..."
cp "${WP_PATH}/wp-config.php" "${BACKUP_DIR}/${BACKUP_NAME}/"

# 4. .htaccess
[ -f "${WP_PATH}/.htaccess" ] && cp "${WP_PATH}/.htaccess" "${BACKUP_DIR}/${BACKUP_NAME}/"

# 5. Create archive
echo "Creating archive..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

echo "Backup complete: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# 6. Cleanup old backups (keep last 7)
ls -t "${BACKUP_DIR}"/wp-backup-*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null
echo "Old backups cleaned up."
```

## Automated Scheduled Backups

```php
// Schedule daily backup via WP-Cron
register_activation_hook(__FILE__, function () {
    if (!wp_next_scheduled('myplugin_daily_backup')) {
        wp_schedule_event(time(), 'daily', 'myplugin_daily_backup');
    }
});

add_action('myplugin_daily_backup', function () {
    $backup_dir = WP_CONTENT_DIR . '/backups';
    wp_mkdir_p($backup_dir);

    $date = date('Ymd-His');
    $file = "{$backup_dir}/db-{$date}.sql";

    global $wpdb;
    // Use WP-CLI if available, or mysqldump
    $command = sprintf(
        'mysqldump -h %s -u %s -p%s %s > %s',
        escapeshellarg(DB_HOST),
        escapeshellarg(DB_USER),
        escapeshellarg(DB_PASSWORD),
        escapeshellarg(DB_NAME),
        escapeshellarg($file)
    );
    exec($command);

    // Compress
    if (file_exists($file)) {
        $gz = gzopen("{$file}.gz", 'w9');
        gzwrite($gz, file_get_contents($file));
        gzclose($gz);
        unlink($file);
    }

    // Cleanup old backups (keep 7 days)
    $files = glob("{$backup_dir}/db-*.sql.gz");
    usort($files, function ($a, $b) { return filemtime($b) - filemtime($a); });
    array_splice($files, 7);
    foreach ($files as $old) { unlink($old); }
});
```

## Popular Backup Plugins

| Plugin | Free Tier | Best For |
|:-------|:----------|:---------|
| **UpdraftPlus** | Yes (basic) | Most popular, cloud storage |
| **Duplicator** | Yes (basic) | Migration + backup |
| **BackWPup** | Yes | Flexible scheduling, multiple destinations |
| **BlogVault** | No (paid) | Real-time, staging, security |
| **Jetpack Backup** | No (paid) | Real-time, easy restore |
| **WP-CLI** | Built-in | Developer-friendly, scriptable |

## Disaster Recovery Procedure

```bash
# 1. Don't panic. Assess the situation.

# 2. Check what happened
tail -100 /var/log/apache2/error.log  # or nginx error.log
wp --path=/var/www/html eval 'echo "WP is running";' 2>&1

# 3. If database is corrupted
wp db check
wp db repair
wp db optimize

# 4. If files are corrupted/hacked
wp core verify-checksums
wp core download --force           # Re-download core files
wp plugin verify-checksums --all

# 5. Restore from backup
# a. Database
wp db import backup.sql
# b. Files
tar -xzf wp-content.tar.gz -C /var/www/html/
# c. Verify
wp core version
wp plugin list
wp option get siteurl

# 6. Search-replace if URLs changed
wp search-replace 'https://old-domain.com' 'https://new-domain.com' --all-tables --dry-run
wp search-replace 'https://old-domain.com' 'https://new-domain.com' --all-tables

# 7. Flush everything
wp cache flush
wp rewrite flush
wp transient delete --all
```

## Migration Between Environments

```bash
# Export from source
wp db export source.sql
tar -czf uploads.tar.gz wp-content/uploads/

# Transfer to destination
scp source.sql user@dest:/tmp/
scp uploads.tar.gz user@dest:/tmp/

# Import on destination
wp db import /tmp/source.sql
tar -xzf /tmp/uploads.tar.gz -C /var/www/html/

# Update URLs
wp search-replace 'http://dev.example.com' 'https://example.com' --all-tables
wp search-replace '/home/dev/public_html' '/var/www/html' --all-tables

# Flush
wp cache flush && wp rewrite flush
```

## Best Practices

1. **3-2-1 rule** — 3 copies, 2 different media, 1 offsite (cloud)
2. **Test your backups** — restore to a staging site periodically
3. **Backup before updates** — always before core, plugin, or theme updates
4. **Backup before migration** — full backup before any domain or host change
5. **Automate backups** — daily database, weekly full site
6. **Use cloud storage** — S3, Google Drive, Dropbox for offsite copies
7. **Exclude cache directories** — `wp-content/cache/`, `wp-content/upgrade/`
8. **Version control themes/plugins** — Git for code, backups for data
9. **Document recovery procedure** — step-by-step guide for your team
10. **Monitor backup success** — email alerts if backup cron fails
