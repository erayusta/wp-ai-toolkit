# WordPress Email & Transactional Mail — Agent Skill

You are an expert in WordPress email: wp_mail(), SMTP configuration, email templates, delivery troubleshooting, and transactional email services.

## wp_mail() Basics

```php
// Simple email
wp_mail('user@example.com', 'Subject', 'Message body');

// HTML email with headers
$headers = [
    'Content-Type: text/html; charset=UTF-8',
    'From: My Site <noreply@example.com>',
    'Reply-To: support@example.com',
    'Cc: admin@example.com',
];
wp_mail('user@example.com', 'Welcome!', '<h1>Hello</h1><p>Welcome to our site.</p>', $headers);

// With attachment
wp_mail('user@example.com', 'Your Invoice', $body, $headers, [ABSPATH . 'invoices/inv-123.pdf']);
```

## HTML Email Template

```php
function myplugin_send_html_email($to, $subject, $content) {
    // Set HTML content type
    add_filter('wp_mail_content_type', function () { return 'text/html'; });
    add_filter('wp_mail_from', function () { return 'noreply@example.com'; });
    add_filter('wp_mail_from_name', function () { return 'My Site'; });

    $html = '<!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; background:#f4f4f4;">
        <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff; margin:20px auto;">
            <tr><td style="padding:30px 40px; background:#21759B; color:#fff;">
                <h1 style="margin:0; font-size:24px;">' . esc_html(get_bloginfo('name')) . '</h1>
            </td></tr>
            <tr><td style="padding:30px 40px;">
                ' . wp_kses_post($content) . '
            </td></tr>
            <tr><td style="padding:20px 40px; background:#f4f4f4; color:#999; font-size:12px;">
                &copy; ' . date('Y') . ' ' . esc_html(get_bloginfo('name')) . '
            </td></tr>
        </table>
    </body></html>';

    $sent = wp_mail($to, $subject, $html);

    // Remove filters to not affect other emails
    remove_filter('wp_mail_content_type', '__return_true');

    return $sent;
}
```

## SMTP Configuration

### Plugin-Based (Recommended)
```bash
# Popular SMTP plugins
wp plugin install wp-mail-smtp --activate    # WP Mail SMTP (most popular)
wp plugin install easy-wp-smtp --activate    # Easy WP SMTP
wp plugin install post-smtp --activate       # Post SMTP
```

### Code-Based SMTP
```php
// In wp-config.php or plugin
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your@gmail.com');
define('SMTP_PASS', 'app-password-here');
define('SMTP_SECURE', 'tls');
define('SMTP_FROM', 'noreply@example.com');
define('SMTP_NAME', 'My Site');

// Hook into PHPMailer
add_action('phpmailer_init', function ($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host       = SMTP_HOST;
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = SMTP_PORT;
    $phpmailer->Username   = SMTP_USER;
    $phpmailer->Password   = SMTP_PASS;
    $phpmailer->SMTPSecure = SMTP_SECURE;
    $phpmailer->From       = SMTP_FROM;
    $phpmailer->FromName   = SMTP_NAME;
});
```

## Transactional Email Services

| Service | Free Tier | Best For |
|:--------|:----------|:---------|
| **Mailgun** | 5,000/month | API-based sending, high volume |
| **SendGrid** | 100/day | Marketing + transactional |
| **Amazon SES** | 62,000/month (EC2) | Cheapest at scale |
| **Postmark** | 100/month | Reliability, fast delivery |
| **SparkPost** | 500/month | Developer-friendly API |
| **Brevo (Sendinblue)** | 300/day | All-in-one marketing |

## Email Hooks

| Hook | Type | Use Case |
|:-----|:-----|:---------|
| `wp_mail` | Filter | Modify all outgoing email (to, subject, message, headers) |
| `wp_mail_from` | Filter | Change sender email |
| `wp_mail_from_name` | Filter | Change sender name |
| `wp_mail_content_type` | Filter | Set HTML or plain text |
| `wp_mail_charset` | Filter | Change character set |
| `phpmailer_init` | Action | Configure PHPMailer directly (SMTP, etc.) |
| `wp_mail_succeeded` | Action | Log successful sends (WP 5.9+) |
| `wp_mail_failed` | Action | Log failed sends |

```php
// Log all failed emails
add_action('wp_mail_failed', function (WP_Error $error) {
    error_log('Email failed: ' . $error->get_error_message());
    error_log('Email data: ' . print_r($error->get_error_data(), true));
});

// Log successful sends
add_action('wp_mail_succeeded', function ($mail_data) {
    error_log('Email sent to: ' . (is_array($mail_data['to']) ? implode(', ', $mail_data['to']) : $mail_data['to']));
});
```

## WooCommerce Email Customization

```php
// Customize WooCommerce email header
add_action('woocommerce_email_header', function ($email_heading, $email) {
    echo '<div style="text-align:center; padding:10px;">';
    echo '<img src="' . esc_url(get_site_icon_url()) . '" width="50" />';
    echo '</div>';
}, 10, 2);

// Add custom content to order emails
add_action('woocommerce_email_before_order_table', function ($order, $sent_to_admin) {
    if (!$sent_to_admin) {
        echo '<p style="color: #21759B;">Thank you for your order!</p>';
    }
}, 10, 2);
```

## Troubleshooting Email Delivery

```php
// Test if wp_mail works
add_action('admin_init', function () {
    if (isset($_GET['test_email']) && current_user_can('manage_options')) {
        $result = wp_mail(
            get_option('admin_email'),
            'WP Mail Test — ' . date('Y-m-d H:i:s'),
            'This is a test email from WordPress.'
        );
        wp_die($result ? 'Email sent successfully.' : 'Email failed. Check error log.');
    }
});
// Visit: /wp-admin/?test_email=1
```

## Best Practices

1. **Use SMTP** — default PHP mail() is unreliable; always configure SMTP
2. **Use a transactional service** — Mailgun/SES/Postmark for production
3. **Set From address** — use a real domain email, not gmail/yahoo
4. **SPF, DKIM, DMARC** — configure DNS records for deliverability
5. **Don't send from wp-admin email** — use a dedicated noreply@ address
6. **Log failures** — hook into `wp_mail_failed` for debugging
7. **Use HTML templates** — inline CSS, table layout for email compatibility
8. **Test with Mailtrap** — use mailtrap.io for staging environments
9. **Rate limit** — don't send bulk from wp_mail, use a queue (Action Scheduler)
10. **Remove filters after use** — content_type and from filters affect all emails
