# WP REST API

> Build custom endpoints, handle authentication, and create custom routes

## What This Skill Covers

- Registering custom REST API routes with permission callbacks
- Implementing authentication with application passwords and JWT
- Extending default endpoints with additional fields
- Handling request validation, sanitization, and error responses

## Example Usage

Ask your AI assistant:

```
> "Create a custom REST API endpoint for project data with authentication on wordpress.test"
```

### Example Output

```php
add_action( 'rest_api_init', 'register_projects_api' );

function register_projects_api() {
    register_rest_route( 'myplugin/v1', '/projects', array(
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'get_projects',
            'permission_callback' => '__return_true',
            'args'                => array(
                'status' => array(
                    'default'           => 'active',
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => function( $value ) {
                        return in_array( $value, array( 'active', 'completed', 'archived' ), true );
                    },
                ),
                'per_page' => array(
                    'default'           => 10,
                    'sanitize_callback' => 'absint',
                ),
            ),
        ),
        array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => 'create_project',
            'permission_callback' => function( $request ) {
                return current_user_can( 'edit_posts' );
            },
            'args'                => array(
                'title'       => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
                'description' => array( 'sanitize_callback' => 'sanitize_textarea_field' ),
            ),
        ),
    ) );
}

function get_projects( WP_REST_Request $request ) : WP_REST_Response {
    $query = new WP_Query( array(
        'post_type'      => 'project',
        'posts_per_page' => $request->get_param( 'per_page' ),
        'meta_key'       => '_project_status',
        'meta_value'     => $request->get_param( 'status' ),
    ) );

    $data = array_map( function( $post ) {
        return array(
            'id'          => $post->ID,
            'title'       => $post->post_title,
            'status'      => get_post_meta( $post->ID, '_project_status', true ),
            'url'         => get_permalink( $post ),
        );
    }, $query->posts );

    return new WP_REST_Response( $data, 200 );
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `scaffold_component` | Generates REST route registration boilerplate |
| `validate_php` | Checks permission callbacks and sanitization |
| `analyze_security` | Audits authentication and authorization logic |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
