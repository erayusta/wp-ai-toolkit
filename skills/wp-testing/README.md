# WP Testing

> Write tests with PHPUnit, WP_UnitTestCase, wp-env, and CI integration

## What This Skill Covers

- Setting up PHPUnit with the WordPress test suite
- Writing unit and integration tests with WP_UnitTestCase
- Using wp-env for local testing environments
- Integrating tests into GitHub Actions CI pipelines

## Example Usage

Ask your AI assistant:

```
> "Write PHPUnit tests for a custom REST API endpoint on wordpress.test"
```

### Example Output

```php
class Test_Projects_API extends WP_UnitTestCase {

    private int $editor_id;

    public function set_up(): void {
        parent::set_up();
        $this->editor_id = self::factory()->user->create( array( 'role' => 'editor' ) );
    }

    public function test_get_projects_returns_200(): void {
        self::factory()->post->create( array(
            'post_type'  => 'project',
            'meta_input' => array( '_project_status' => 'active' ),
        ) );

        $request  = new WP_REST_Request( 'GET', '/myplugin/v1/projects' );
        $response = rest_do_request( $request );

        $this->assertSame( 200, $response->get_status() );
        $this->assertCount( 1, $response->get_data() );
    }

    public function test_create_project_requires_auth(): void {
        $request = new WP_REST_Request( 'POST', '/myplugin/v1/projects' );
        $request->set_body_params( array( 'title' => 'New Project' ) );

        $response = rest_do_request( $request );

        $this->assertSame( 401, $response->get_status() );
    }

    public function test_create_project_succeeds_for_editor(): void {
        wp_set_current_user( $this->editor_id );

        $request = new WP_REST_Request( 'POST', '/myplugin/v1/projects' );
        $request->set_body_params( array(
            'title'       => 'Test Project',
            'description' => 'A test project description.',
        ) );

        $response = rest_do_request( $request );

        $this->assertSame( 201, $response->get_status() );
        $this->assertSame( 'Test Project', $response->get_data()['title'] );
    }

    public function test_invalid_status_returns_error(): void {
        $request = new WP_REST_Request( 'GET', '/myplugin/v1/projects' );
        $request->set_param( 'status', 'invalid' );

        $response = rest_do_request( $request );

        $this->assertSame( 400, $response->get_status() );
    }
}
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `run_tests` | Executes PHPUnit test suites |
| `scaffold_component` | Generates test class boilerplate |
| `validate_php` | Checks test files for syntax errors |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
