# WP Coding Standards

> Enforce PHPCS with WPCS rules, pre-commit hooks, and CI pipelines

## What This Skill Covers

- Installing and configuring PHP_CodeSniffer with WordPress standards
- Setting up pre-commit hooks to catch violations before push
- Integrating PHPCS into GitHub Actions and CI pipelines
- Customizing rulesets for project-specific exceptions

## Example Usage

Ask your AI assistant:

```
> "Set up PHPCS with WordPress coding standards and a pre-commit hook on wordpress.test"
```

### Example Output

```xml
<!-- phpcs.xml.dist -->
<?xml version="1.0"?>
<ruleset name="My Plugin Standards">
    <description>PHPCS ruleset for the plugin.</description>

    <file>./includes</file>
    <file>./admin</file>
    <file>./public</file>

    <arg name="extensions" value="php"/>
    <arg name="colors"/>
    <arg value="sp"/>

    <rule ref="WordPress">
        <exclude name="WordPress.Files.FileName.InvalidClassFileName"/>
    </rule>

    <rule ref="WordPress.WP.I18n">
        <properties>
            <property name="text_domain" type="array">
                <element value="myplugin"/>
            </property>
        </properties>
    </rule>

    <config name="minimum_wp_version" value="6.2"/>
    <config name="testVersion" value="8.0-"/>
</ruleset>
```

## Related Tools

| Tool | How It Helps |
|:-----|:------------|
| `validate_php` | Runs PHPCS against WordPress coding standards |
| `fix_code_style` | Auto-fixes coding standard violations with PHPCBF |
| `scaffold_component` | Generates standards-compliant boilerplate |

## Files

- [`instructions.md`](instructions.md) — Full skill reference with code examples

---

*Part of [WordPress AI Toolkit](../../README.md) — 23 tools, 33 skills for WordPress development.*
