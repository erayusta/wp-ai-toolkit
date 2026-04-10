# WordPress REST API — Agent Skill

You are an expert WordPress REST API developer. When helping users with REST API tasks, follow these guidelines.

## Core Concepts

- The WordPress REST API uses JSON over HTTP with standard methods: GET, POST, PUT, PATCH, DELETE
- Base URL: `{site_url}/wp-json/wp/v2/`
- All core endpoints are under the `wp/v2` namespace
- Authentication: Cookie auth (browser), Application Passwords, OAuth 2.0, or JWT

## Key Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/wp/v2/posts` | GET, POST | List/create posts |
| `/wp/v2/posts/<id>` | GET, PUT, PATCH, DELETE | Single post CRUD |
| `/wp/v2/pages` | GET, POST | List/create pages |
| `/wp/v2/media` | GET, POST | List/upload media |
| `/wp/v2/categories` | GET, POST | Taxonomy terms |
| `/wp/v2/tags` | GET, POST | Taxonomy terms |
| `/wp/v2/users` | GET, POST | User management |
| `/wp/v2/comments` | GET, POST | Comment management |
| `/wp/v2/search` | GET | Cross-content search |
| `/wp/v2/settings` | GET, POST | Site settings |
| `/wp/v2/plugins` | GET, POST | Plugin management |
| `/wp/v2/themes` | GET | Theme listing |
| `/wp/v2/block-types` | GET | Registered block types |
| `/wp/v2/blocks` | GET, POST | Reusable blocks |
| `/wp/v2/block-patterns/patterns` | GET | Block patterns |
| `/wp/v2/global-styles` | GET | Global styles |

## Registering Custom Endpoints

```php
add_action('rest_api_init', function () {
    register_rest_route('myplugin/v1', '/items', [
        'methods'  => 'GET',
        'callback' => 'myplugin_get_items',
        'permission_callback' => function () {
            return current_user_can('read');
        },
        'args' => [
            'per_page' => [
                'type'              => 'integer',
                'default'           => 10,
                'sanitize_callback' => 'absint',
            ],
        ],
    ]);
});

function myplugin_get_items(WP_REST_Request $request) {
    $per_page = $request->get_param('per_page');
    // ... fetch and return data
    return new WP_REST_Response($data, 200);
}
```

## Best Practices

1. **Always use `permission_callback`** — never leave it null (use `__return_true` for public endpoints)
2. **Sanitize all input** — use `sanitize_callback` in args or sanitize in the callback
3. **Validate with `validate_callback`** — for complex validation logic
4. **Use proper HTTP status codes** — 200, 201, 400, 401, 403, 404, 500
5. **Return `WP_REST_Response`** — for setting headers and status codes
6. **Use `WP_Error`** — for error responses with proper codes
7. **Namespace your routes** — `yourplugin/v1` to avoid collisions
8. **Version your API** — include version in namespace
9. **Use `register_rest_field()`** — to add fields to existing endpoints
10. **Use `register_meta()`** with `show_in_rest` — to expose meta via REST

## Common Patterns

### Adding fields to existing endpoints
```php
register_rest_field('post', 'my_custom_field', [
    'get_callback' => function ($post) {
        return get_post_meta($post['id'], 'my_custom_field', true);
    },
    'update_callback' => function ($value, $post) {
        update_post_meta($post->ID, 'my_custom_field', sanitize_text_field($value));
    },
    'schema' => [
        'type'        => 'string',
        'description' => 'My custom field',
        'context'     => ['view', 'edit'],
    ],
]);
```

### Authentication with Application Passwords
```javascript
const response = await fetch('https://example.com/wp-json/wp/v2/posts', {
    headers: {
        'Authorization': 'Basic ' + btoa('username:application_password'),
        'Content-Type': 'application/json',
    },
});
```
