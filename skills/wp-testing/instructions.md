# WordPress Testing — Agent Skill

You are an expert in WordPress testing: PHPUnit, WP_UnitTestCase, wp-env, integration tests, and CI pipelines.

## Setup with wp-env

```bash
# Install wp-env (Docker-based WordPress environment)
npm install -g @wordpress/env

# Create .wp-env.json in project root
cat > .wp-env.json << 'EOF'
{
  "core": null,
  "phpVersion": "8.2",
  "plugins": ["."],
  "config": {
    "WP_DEBUG": true,
    "SCRIPT_DEBUG": true
  }
}
EOF

# Start environment
wp-env start        # http://localhost:8888
wp-env stop
wp-env destroy      # Reset everything

# Run WP-CLI commands in wp-env
wp-env run cli wp post list
wp-env run cli wp plugin list
```

## PHPUnit Setup for Plugins

```bash
# Scaffold test files using WP-CLI
wp scaffold plugin-tests my-plugin

# This creates:
# my-plugin/
# ├── tests/
# │   ├── bootstrap.php     — Test bootstrap
# │   └── test-sample.php   — Sample test
# ├── phpunit.xml.dist      — PHPUnit config
# └── bin/
#     └── install-wp-tests.sh  — Test DB installer

# Install test suite
cd my-plugin
bash bin/install-wp-tests.sh wordpress_test root '' localhost latest

# Run tests
phpunit
# Or with wp-env:
wp-env run phpunit phpunit
```

## Writing Tests (WP_UnitTestCase)

```php
<?php
class Test_My_Plugin extends WP_UnitTestCase {

    // Runs before each test
    public function set_up() {
        parent::set_up();
        // Setup code here
    }

    // Runs after each test
    public function tear_down() {
        parent::tear_down();
        // Cleanup code here
    }

    // Test custom post type registration
    public function test_cpt_is_registered() {
        $this->assertTrue(post_type_exists('book'));
    }

    // Test post creation
    public function test_create_book() {
        $post_id = $this->factory->post->create([
            'post_type'  => 'book',
            'post_title' => 'Test Book',
        ]);

        $this->assertGreaterThan(0, $post_id);
        $this->assertEquals('book', get_post_type($post_id));
        $this->assertEquals('Test Book', get_the_title($post_id));
    }

    // Test custom meta
    public function test_book_meta() {
        $post_id = $this->factory->post->create(['post_type' => 'book']);
        update_post_meta($post_id, '_price', '29.99');

        $this->assertEquals('29.99', get_post_meta($post_id, '_price', true));
    }

    // Test hooks
    public function test_action_fires() {
        $fired = false;
        add_action('myplugin_after_save', function () use (&$fired) {
            $fired = true;
        });

        do_action('myplugin_after_save');
        $this->assertTrue($fired);
    }

    // Test filter modifies value
    public function test_price_filter() {
        add_filter('myplugin_format_price', function ($price) {
            return '$' . number_format($price, 2);
        });

        $formatted = apply_filters('myplugin_format_price', 29.9);
        $this->assertEquals('$29.90', $formatted);
    }

    // Test REST API endpoint
    public function test_rest_endpoint() {
        $user = $this->factory->user->create(['role' => 'administrator']);
        wp_set_current_user($user);

        $request = new WP_REST_Request('GET', '/my-plugin/v1/books');
        $response = rest_get_server()->dispatch($request);

        $this->assertEquals(200, $response->get_status());
        $this->assertIsArray($response->get_data());
    }

    // Test permissions
    public function test_subscriber_cannot_create() {
        $user = $this->factory->user->create(['role' => 'subscriber']);
        wp_set_current_user($user);

        $request = new WP_REST_Request('POST', '/my-plugin/v1/books');
        $response = rest_get_server()->dispatch($request);

        $this->assertEquals(403, $response->get_status());
    }

    // Test with expected WP error
    public function test_invalid_input_returns_error() {
        $result = myplugin_process_data('');
        $this->assertWPError($result);
        $this->assertEquals('invalid_input', $result->get_error_code());
    }
}
```

## Test Factories

```php
// Create posts
$post_id = $this->factory->post->create(['post_title' => 'Test']);
$posts   = $this->factory->post->create_many(10, ['post_type' => 'book']);

// Create users
$admin = $this->factory->user->create(['role' => 'administrator']);
$editor = $this->factory->user->create(['role' => 'editor']);

// Create terms
$term_id = $this->factory->term->create(['taxonomy' => 'category', 'name' => 'Fiction']);

// Create comments
$comment_id = $this->factory->comment->create(['comment_post_ID' => $post_id]);

// Create attachments
$attachment_id = $this->factory->attachment->create_upload_object('/path/to/image.jpg', $post_id);
```

## phpunit.xml.dist

```xml
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertWarningsToExceptions="true"
>
    <testsuites>
        <testsuite name="My Plugin Tests">
            <directory suffix=".php">tests</directory>
        </testsuite>
    </testsuites>
    <php>
        <const name="WP_TESTS_DOMAIN" value="localhost" />
        <const name="WP_TESTS_EMAIL" value="admin@localhost" />
    </php>
</phpunit>
```

## Mocking

```php
// Mock wp_remote_get
public function test_api_call() {
    // Use WP's built-in HTTP filter
    add_filter('pre_http_request', function ($preempt, $args, $url) {
        if (strpos($url, 'api.example.com') !== false) {
            return [
                'response' => ['code' => 200],
                'body'     => wp_json_encode(['status' => 'ok']),
            ];
        }
        return $preempt;
    }, 10, 3);

    $result = myplugin_fetch_api_data();
    $this->assertEquals('ok', $result['status']);
}

// Mock current time
public function test_scheduled_content() {
    // Use WordPress time travel
    update_option('gmt_offset', 0);
    // Or use a time mock library
}
```

## JavaScript Testing (Block Editor)

```bash
# With @wordpress/scripts
npm install --save-dev @wordpress/scripts

# package.json
{
  "scripts": {
    "test:unit": "wp-scripts test-unit-js",
    "test:unit:watch": "wp-scripts test-unit-js --watch"
  }
}
```

```js
// src/__tests__/my-block.test.js
import { render, screen } from '@testing-library/react';
import Edit from '../edit';

describe('My Block Edit', () => {
    it('renders heading input', () => {
        render(<Edit attributes={{ heading: 'Test' }} setAttributes={jest.fn()} />);
        expect(screen.getByText('Test')).toBeInTheDocument();
    });
});
```

## Best Practices

1. **Use WP_UnitTestCase** — not raw PHPUnit; gives you WordPress test factories and helpers
2. **Isolate tests** — each test should be independent, use setUp/tearDown
3. **Use factories** — `$this->factory->post->create()` instead of `wp_insert_post()`
4. **Mock HTTP requests** — use `pre_http_request` filter to mock external APIs
5. **Test permissions** — always test what different user roles can/cannot do
6. **Test hooks** — verify your actions and filters fire correctly
7. **Use wp-env** — Docker-based environment ensures consistent test results
8. **Run in CI** — GitHub Actions + wp-env for automated testing on every PR
9. **Test edge cases** — empty input, max length, special characters, WP_Error responses
10. **Don't test WordPress itself** — test YOUR code, not core functions
