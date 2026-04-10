# WP Email & Transactional

> Configure wp_mail, SMTP providers, Mailgun/SES integration, and email templates

## What This Skill Covers

- Customizing wp_mail with HTML templates and headers
- Setting up SMTP with Mailgun, Amazon SES, or SendGrid
- Building branded transactional email templates
- Debugging email delivery issues and configuring SPF/DKIM

## Example Usage

Ask your AI assistant:

```
> "Set up Amazon SES for transactional emails with HTML templates on wordpress.test"
```

### Example Output

```php
// Configure wp_mail to use Amazon SES via SMTP
add_action( 'phpmailer_init', 'configure_ses_smtp' );

function configure_ses_smtp( $phpmailer ) {
    $phpmailer->isSMTP();
    $phpmailer->Host       = 'email-smtp.us-east-1.amazonaws.com';
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = 587;
    $phpmailer->SMTPSecure = 'tls';
    $phpmailer->Username   = defined( 'SES_SMTP_USER' ) ? SES_SMTP_USER : '';
    $phpmailer->Password   = defined( 'SES_SMTP_PASS' ) ? SES_SMTP_PASS : '';
    $phpmailer->From       = 'noreply@wordpress.test';
    $phpmailer->FromName   = get_bloginfo( 'name' );
}

// Set HTML content type for all wp_mail
add_filter( 'wp_mail_content_type', function() {
    return 'text/html';
} );

// Custom email template wrapper
function wrap_email_template( string $content, string $subject ) : string {
    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0073aa; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h1>
        </div>
        <div style="padding: 30px 20px;">
            <h2><?php echo esc_html( $subject ); ?></h2>
            <?php echo wp_kses_post( $content ); ?>
        </div>
        <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; <?php echo esc_html( gmdate( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?></p>
        </div>
    </body>
    </html>
    <?php
    return ob_get_clean();
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `validate_php` | Checks email configuration and template code |
| `run_wp_cli` | Tests email delivery with wp eval commands |
| `check_dns` | Verifies SPF, DKIM, and DMARC records |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
