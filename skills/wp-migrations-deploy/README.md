# WP Migrations & Deploy

> Handle database migrations, WP-CLI workflows, Bedrock setup, and deployment pipelines

## What This Skill Covers

- Running database migrations with version tracking
- Automating deployments with WP-CLI and shell scripts
- Setting up Bedrock-based WordPress with Composer
- Configuring staging-to-production deployment pipelines

## Example Usage

Ask your AI assistant:

```
> "Create a versioned database migration system for my plugin on wordpress.test"
```

### Example Output

```php
class Plugin_Migrator {
    private string $option_key = 'myplugin_db_version';
    private string $target_version = '1.3.0';

    public function run(): void {
        $current = get_option( $this->option_key, '0.0.0' );

        if ( version_compare( $current, $this->target_version, '>=' ) ) {
            return;
        }

        if ( version_compare( $current, '1.1.0', '<' ) ) {
            $this->migrate_to_1_1_0();
        }
        if ( version_compare( $current, '1.2.0', '<' ) ) {
            $this->migrate_to_1_2_0();
        }
        if ( version_compare( $current, '1.3.0', '<' ) ) {
            $this->migrate_to_1_3_0();
        }

        update_option( $this->option_key, $this->target_version );
    }

    private function migrate_to_1_1_0(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'myplugin_logs';
        $wpdb->query( "ALTER TABLE $table ADD COLUMN severity varchar(20) DEFAULT 'info' AFTER message" );
    }

    private function migrate_to_1_2_0(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'myplugin_logs';
        $wpdb->query( "CREATE INDEX idx_severity ON $table (severity)" );
    }

    private function migrate_to_1_3_0(): void {
        // Migrate serialized data to JSON
        global $wpdb;
        $rows = $wpdb->get_results( "SELECT id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_myplugin_settings'" );
        foreach ( $rows as $row ) {
            $data = maybe_unserialize( $row->meta_value );
            $wpdb->update( $wpdb->postmeta, array( 'meta_value' => wp_json_encode( $data ) ), array( 'id' => $row->id ) );
        }
    }
}

// Run on admin_init
add_action( 'admin_init', function() {
    ( new Plugin_Migrator() )->run();
} );
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_wp_cli` | Executes migrations and search-replace on deploy |
| `analyze_database` | Checks table schemas before and after migration |
| `validate_config` | Verifies environment-specific wp-config settings |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
