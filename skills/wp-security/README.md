# WP Security

> Implement input validation, output escaping, nonces, roles, and site hardening

## What This Skill Covers

- Validating and sanitizing all user input with WordPress functions
- Escaping output with esc_html, esc_attr, esc_url, and wp_kses
- Implementing nonce verification for forms and AJAX requests
- Configuring roles, capabilities, and security hardening measures

## Example Usage

Ask your AI assistant:

```
> "Audit the security of a custom form handler on wordpress.test"
```

### Example Output

```
Security audit results for custom-form-handler.php:

[CRITICAL] Line 23: Direct use of $_POST['email'] in wp_mail()
  Fix: $email = sanitize_email( $_POST['email'] );
       if ( ! is_email( $email ) ) { wp_die( 'Invalid email.' ); }

[CRITICAL] Line 31: Missing nonce verification
  Fix: Add before processing:
       if ( ! isset( $_POST['_wpnonce'] )
           || ! wp_verify_nonce( $_POST['_wpnonce'], 'submit_form_action' ) ) {
           wp_die( 'Security check failed.' );
       }

[HIGH] Line 45: Unescaped output in admin notice
  Before: echo '<p>' . $message . '</p>';
  Fix:    echo '<p>' . esc_html( $message ) . '</p>';

[MEDIUM] Line 12: Missing capability check
  Fix: if ( ! current_user_can( 'edit_posts' ) ) {
           wp_die( 'Unauthorized access.' );
       }

[LOW] Line 8: No ABSPATH check at top of file
  Fix: defined( 'ABSPATH' ) || exit;

Summary: 2 critical, 1 high, 1 medium, 1 low severity issues found.
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `analyze_security` | Scans for XSS, CSRF, and SQL injection vulnerabilities |
| `validate_php` | Checks sanitization and escaping function usage |
| `check_permissions` | Audits role and capability assignments |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
