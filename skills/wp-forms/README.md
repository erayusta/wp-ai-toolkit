# WP Forms

> Build with Contact Form 7, WPForms, Gravity Forms, and custom AJAX forms

## What This Skill Covers

- Configuring Contact Form 7 with custom validation and mail tags
- Building advanced forms with WPForms and Gravity Forms
- Creating custom AJAX-powered forms with nonce verification
- Integrating form submissions with CRMs and email marketing

## Example Usage

Ask your AI assistant:

```
> "Create a custom AJAX contact form with honeypot spam protection on wordpress.test"
```

### Example Output

```php
// Enqueue form script
add_action( 'wp_enqueue_scripts', 'contact_form_assets' );
function contact_form_assets() {
    wp_enqueue_script( 'contact-form', plugin_dir_url( __FILE__ ) . 'js/contact-form.js', array(), '1.0', true );
    wp_localize_script( 'contact-form', 'contactForm', array(
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'contact_form_nonce' ),
    ) );
}

// Handle AJAX submission
add_action( 'wp_ajax_submit_contact', 'handle_contact_form' );
add_action( 'wp_ajax_nopriv_submit_contact', 'handle_contact_form' );

function handle_contact_form() {
    check_ajax_referer( 'contact_form_nonce', 'nonce' );

    // Honeypot check
    if ( ! empty( $_POST['website_url'] ) ) {
        wp_send_json_error( 'Spam detected.' );
    }

    $name    = sanitize_text_field( $_POST['name'] ?? '' );
    $email   = sanitize_email( $_POST['email'] ?? '' );
    $message = sanitize_textarea_field( $_POST['message'] ?? '' );

    if ( ! $name || ! is_email( $email ) || ! $message ) {
        wp_send_json_error( 'Please fill in all required fields.' );
    }

    $sent = wp_mail(
        get_option( 'admin_email' ),
        sprintf( 'Contact Form: %s', $name ),
        $message,
        array( 'Reply-To: ' . $email )
    );

    $sent ? wp_send_json_success( 'Message sent!' ) : wp_send_json_error( 'Send failed.' );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `validate_php` | Checks form handling code for security issues |
| `analyze_security` | Verifies nonce usage and input sanitization |
| `scaffold_component` | Generates form boilerplate with AJAX handlers |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
