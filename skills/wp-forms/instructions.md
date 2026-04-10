# WordPress Forms — Agent Skill

You are an expert in WordPress form solutions: Contact Form 7, WPForms, Gravity Forms, custom AJAX forms, and form integration patterns.

## Contact Form 7

### Custom Form Template
```
[text* your-name placeholder "Name"]
[email* your-email placeholder "Email"]
[tel your-phone placeholder "Phone"]
[select your-subject "General Inquiry" "Support" "Sales"]
[textarea your-message placeholder "Message"]
[file your-file limit:5mb filetypes:pdf|doc|docx]
[submit "Send Message"]
```

### CF7 Hooks
```php
// Validate before send
add_filter('wpcf7_validate_email*', function ($result, $tag) {
    $value = isset($_POST[$tag->name]) ? trim($_POST[$tag->name]) : '';
    if (!is_email($value)) {
        $result->invalidate($tag, 'Please enter a valid email.');
    }
    // Block free email providers
    $blocked = ['gmail.com', 'yahoo.com', 'hotmail.com'];
    $domain = substr(strrchr($value, '@'), 1);
    if (in_array($domain, $blocked)) {
        $result->invalidate($tag, 'Please use your business email.');
    }
    return $result;
}, 20, 2);

// After successful submission
add_action('wpcf7_mail_sent', function ($form) {
    $submission = WPCF7_Submission::get_instance();
    $data = $submission->get_posted_data();

    // Save to database, CRM, etc.
    myplugin_save_lead($data['your-name'], $data['your-email'], $data['your-message']);
});

// Custom mail tag
add_filter('wpcf7_special_mail_tags', function ($output, $name) {
    if ($name === 'user_ip') {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    return $output;
}, 10, 2);
```

## Gravity Forms

### PHP API
```php
// Create entry programmatically
$entry = GFAPI::add_entry([
    'form_id' => 1,
    '1'       => 'John Doe',      // Field ID 1 = Name
    '2'       => 'john@example.com', // Field ID 2 = Email
    '3'       => 'Hello world',    // Field ID 3 = Message
]);

// Get entries
$entries = GFAPI::get_entries(1, [
    'field_filters' => [
        ['key' => '2', 'value' => '@example.com', 'operator' => 'contains'],
    ],
]);

// Update entry
GFAPI::update_entry_field($entry_id, '3', 'Updated message');
```

### Gravity Forms Hooks
```php
// Pre-submission validation
add_filter('gform_validation_1', function ($validation_result) {
    $form = $validation_result['form'];
    foreach ($form['fields'] as &$field) {
        if ($field->id == 2) { // Email field
            $value = rgpost("input_{$field->id}");
            if (strpos($value, '+') !== false) {
                $validation_result['is_valid'] = false;
                $field->failed_validation = true;
                $field->validation_message = 'Email aliases not allowed.';
            }
        }
    }
    $validation_result['form'] = $form;
    return $validation_result;
});

// After submission
add_action('gform_after_submission_1', function ($entry, $form) {
    $name  = rgar($entry, '1');
    $email = rgar($entry, '2');
    // Send to CRM, webhook, etc.
}, 10, 2);
```

## Custom AJAX Form (Native WordPress)

```php
// Frontend form
function myplugin_contact_form() {
    ob_start(); ?>
    <form id="myplugin-form" class="myplugin-form">
        <?php wp_nonce_field('myplugin_form_submit', 'myplugin_nonce'); ?>
        <div class="form-group">
            <label for="mp-name">Name *</label>
            <input type="text" id="mp-name" name="name" required>
        </div>
        <div class="form-group">
            <label for="mp-email">Email *</label>
            <input type="email" id="mp-email" name="email" required>
        </div>
        <div class="form-group">
            <label for="mp-message">Message</label>
            <textarea id="mp-message" name="message" rows="4"></textarea>
        </div>
        <button type="submit" class="btn">Send</button>
        <div class="form-response"></div>
    </form>
    <?php return ob_get_clean();
}
add_shortcode('myplugin_form', 'myplugin_contact_form');

// AJAX handler
add_action('wp_ajax_myplugin_submit_form', 'myplugin_handle_form');
add_action('wp_ajax_nopriv_myplugin_submit_form', 'myplugin_handle_form');

function myplugin_handle_form() {
    check_ajax_referer('myplugin_form_submit', 'nonce');

    $name    = sanitize_text_field($_POST['name'] ?? '');
    $email   = sanitize_email($_POST['email'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');

    if (empty($name) || empty($email)) {
        wp_send_json_error(['message' => 'Name and email are required.'], 400);
    }

    // Save to database
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'myplugin_submissions', [
        'name'       => $name,
        'email'      => $email,
        'message'    => $message,
        'created_at' => current_time('mysql'),
    ]);

    // Send notification email
    wp_mail(get_option('admin_email'), "New form submission from {$name}", $message);

    wp_send_json_success(['message' => 'Thank you! We\'ll be in touch.']);
}

// Enqueue JS
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('myplugin-form', plugin_dir_url(__FILE__) . 'js/form.js', ['jquery'], '1.0', true);
    wp_localize_script('myplugin-form', 'mpForm', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('myplugin_form_submit'),
    ]);
});
```

```js
// js/form.js
jQuery(function($) {
    $('#myplugin-form').on('submit', function(e) {
        e.preventDefault();
        var $form = $(this), $btn = $form.find('button'), $resp = $form.find('.form-response');
        $btn.prop('disabled', true).text('Sending...');

        $.post(mpForm.ajaxUrl, {
            action: 'myplugin_submit_form',
            nonce: mpForm.nonce,
            name: $form.find('[name=name]').val(),
            email: $form.find('[name=email]').val(),
            message: $form.find('[name=message]').val()
        }).done(function(res) {
            $resp.html('<p class="success">' + res.data.message + '</p>');
            $form[0].reset();
        }).fail(function(xhr) {
            var msg = xhr.responseJSON?.data?.message || 'Something went wrong.';
            $resp.html('<p class="error">' + msg + '</p>');
        }).always(function() {
            $btn.prop('disabled', false).text('Send');
        });
    });
});
```

## File Upload in Forms

```php
// Handle file upload in AJAX
function myplugin_handle_file_upload() {
    check_ajax_referer('myplugin_upload', 'nonce');

    if (empty($_FILES['file'])) {
        wp_send_json_error('No file uploaded.');
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $file = wp_handle_upload($_FILES['file'], [
        'test_form' => false,
        'mimes'     => ['pdf' => 'application/pdf', 'jpg|jpeg' => 'image/jpeg', 'png' => 'image/png'],
    ]);

    if (isset($file['error'])) {
        wp_send_json_error($file['error']);
    }

    wp_send_json_success(['url' => $file['url'], 'file' => $file['file']]);
}
```

## Best Practices

1. **Always validate server-side** — client-side validation is for UX, not security
2. **Use nonces** — `wp_nonce_field()` + `check_ajax_referer()`
3. **Sanitize all input** — `sanitize_text_field()`, `sanitize_email()`, etc.
4. **Rate limit submissions** — use transients to prevent spam floods
5. **Honeypot fields** — add a hidden field; bots fill it, humans don't
6. **Store submissions** — don't rely only on email; save to database too
7. **File upload security** — whitelist MIME types, limit file size, scan for malware
8. **AJAX for UX** — no page reload, instant feedback, loading states
9. **Accessible forms** — proper labels, aria attributes, error messages
10. **GDPR compliance** — consent checkbox, privacy policy link, data retention policy
