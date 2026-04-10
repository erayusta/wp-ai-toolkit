# WP Debugging

> Use WP_DEBUG, debug.log, Query Monitor, and diagnose WordPress errors

## What This Skill Covers

- Configuring WP_DEBUG, WP_DEBUG_LOG, and SCRIPT_DEBUG constants
- Reading and interpreting debug.log entries
- Using Query Monitor to profile queries, hooks, and HTTP requests
- Diagnosing white screen of death, fatal errors, and plugin conflicts

## Example Usage

Ask your AI assistant:

```
> "Help me debug a 500 error after updating a plugin on wordpress.test"
```

### Example Output

```
Diagnosis steps for 500 error on wordpress.test:

1. Enable debug logging in wp-config.php:
   define( 'WP_DEBUG', true );
   define( 'WP_DEBUG_LOG', true );
   define( 'WP_DEBUG_DISPLAY', false );

2. Check debug.log:
   tail -50 /var/www/wordpress.test/wp-content/debug.log

   Found: PHP Fatal error: Uncaught TypeError: Argument #1 ($post)
   must be of type WP_Post, null given in
   /wp-content/plugins/custom-seo/includes/meta-handler.php on line 47

3. Root cause: The plugin's meta-handler.php calls get_post() without
   null-checking the return value. The recent update changed a function
   signature.

4. Quick fix:
   $post = get_post( $post_id );
   if ( ! $post instanceof WP_Post ) {
       return;
   }

5. Disable the plugin via WP-CLI while patching:
   wp plugin deactivate custom-seo --path=/var/www/wordpress.test
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `validate_php` | Checks PHP files for syntax errors |
| `run_wp_cli` | Deactivates plugins and runs diagnostics |
| `analyze_logs` | Parses and summarizes debug.log entries |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
