# WordPress Coding Standards — Agent Skill

You are an expert in WordPress PHP Coding Standards (WPCS), PHP_CodeSniffer setup, and code quality enforcement.

## Install PHPCS + WPCS

```bash
# Global install via Composer
composer global require "squizlabs/php_codesniffer=*"
composer global require "wp-coding-standards/wpcs=*"
composer global require "phpcompatibility/phpcompatibility-wp=*"

# Set WPCS path
phpcs --config-set installed_paths ~/.composer/vendor/wp-coding-standards/wpcs,~/.composer/vendor/phpcompatibility/phpcompatibility-wp

# Verify
phpcs -i
# Should show: WordPress, WordPress-Core, WordPress-Docs, WordPress-Extra

# Per-project install
composer require --dev squizlabs/php_codesniffer wp-coding-standards/wpcs phpcompatibility/phpcompatibility-wp
```

## Running PHPCS

```bash
# Check a file
phpcs --standard=WordPress my-plugin/my-plugin.php

# Check entire plugin
phpcs --standard=WordPress --extensions=php my-plugin/

# Auto-fix what's possible
phpcbf --standard=WordPress my-plugin/

# Summary only
phpcs --standard=WordPress --report=summary my-plugin/

# Specific rules
phpcs --standard=WordPress-Core my-plugin/   # Core rules only
phpcs --standard=WordPress-Extra my-plugin/  # Extra best practices
phpcs --standard=WordPress-Docs my-plugin/   # Documentation rules

# Check PHP compatibility
phpcs --standard=PHPCompatibilityWP --runtime-set testVersion 7.4- my-plugin/
```

## phpcs.xml.dist Configuration

```xml
<?xml version="1.0"?>
<ruleset name="My Plugin">
    <description>WPCS rules for My Plugin</description>

    <!-- Scan these files -->
    <file>./</file>

    <!-- Exclude -->
    <exclude-pattern>/vendor/*</exclude-pattern>
    <exclude-pattern>/node_modules/*</exclude-pattern>
    <exclude-pattern>/tests/*</exclude-pattern>
    <exclude-pattern>/assets/*</exclude-pattern>
    <exclude-pattern>*.js</exclude-pattern>
    <exclude-pattern>*.css</exclude-pattern>

    <!-- WordPress standards -->
    <rule ref="WordPress">
        <!-- Allow short array syntax -->
        <exclude name="Generic.Arrays.DisallowShortArraySyntax"/>
        <!-- Allow PSR-4 file naming for classes -->
        <exclude name="WordPress.Files.FileName.InvalidClassFileName"/>
        <exclude name="WordPress.Files.FileName.NotHyphenatedLowercase"/>
    </rule>

    <!-- PHP compatibility -->
    <rule ref="PHPCompatibilityWP"/>
    <config name="testVersion" value="7.4-"/>

    <!-- Text domain for i18n -->
    <rule ref="WordPress.WP.I18n">
        <properties>
            <property name="text_domain" type="array">
                <element value="my-plugin"/>
            </property>
        </properties>
    </rule>

    <!-- Prefix for function/class names -->
    <rule ref="WordPress.NamingConventions.PrefixAllGlobals">
        <properties>
            <property name="prefixes" type="array">
                <element value="myplugin"/>
                <element value="MyPlugin"/>
            </property>
        </properties>
    </rule>

    <!-- Minimum WP version for deprecated function checks -->
    <rule ref="WordPress.WP.DeprecatedFunctions">
        <properties>
            <property name="minimum_wp_version" value="6.0"/>
        </properties>
    </rule>
</ruleset>
```

## Common WPCS Violations & Fixes

| Violation | Wrong | Right |
|:----------|:------|:------|
| Yoda conditions | `if ($a == 1)` | `if (1 === $a)` |
| Strict comparison | `if ($a == 'yes')` | `if ($a === 'yes')` |
| Space after cast | `(int)$var` | `(int) $var` |
| Array syntax | `array()` | `[]` (if excluded) |
| Escaping output | `echo $var` | `echo esc_html( $var )` |
| Nonce verification | Missing | `wp_verify_nonce()` |
| Input sanitization | `$_POST['x']` | `sanitize_text_field( wp_unslash( $_POST['x'] ) )` |
| File naming | `myClass.php` | `class-my-class.php` |
| Function naming | `myFunction()` | `my_function()` (snake_case) |
| Spaces in brackets | `function()` | `function ()` |
| Tabs not spaces | Spaces | Tabs for indentation |

## Pre-Commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run PHPCS on staged PHP files
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.php$')

if [ -z "$STAGED" ]; then
    exit 0
fi

echo "Running PHPCS on staged files..."
vendor/bin/phpcs --standard=phpcs.xml.dist $STAGED

if [ $? -ne 0 ]; then
    echo ""
    echo "PHPCS errors found. Fix them or run: vendor/bin/phpcbf $STAGED"
    exit 1
fi
```

```bash
# Make hook executable
chmod +x .git/hooks/pre-commit

# Or use a Composer package
composer require --dev automattic/vipcs
```

## CI/CD Integration (GitHub Actions)

```yaml
name: PHPCS
on: [push, pull_request]
jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          tools: composer, cs2pr
      - run: composer install
      - run: vendor/bin/phpcs --standard=phpcs.xml.dist --report=checkstyle | cs2pr
```

## WordPress Naming Conventions

| Element | Convention | Example |
|:--------|:----------|:--------|
| Functions | `snake_case` | `myplugin_get_data()` |
| Classes | `PascalCase` with underscores | `MyPlugin_Admin_Page` |
| Class files | `class-{name}.php` | `class-admin-page.php` |
| Constants | `UPPER_SNAKE_CASE` | `MYPLUGIN_VERSION` |
| Hooks | `snake_case` with prefix | `myplugin_after_save` |
| Options | `snake_case` with prefix | `myplugin_settings` |
| Post meta | `_prefix_key` (underscore hidden) | `_myplugin_price` |
| CSS classes | `kebab-case` with prefix | `myplugin-card` |
| JS handles | `kebab-case` with prefix | `myplugin-admin-script` |
| Text domain | `kebab-case` | `my-plugin` |

## Best Practices

1. **Use WPCS from day one** — retrofitting is painful; start clean
2. **Configure phpcs.xml.dist** — commit it to repo for team consistency
3. **Auto-fix with phpcbf** — fixes ~60% of violations automatically
4. **Use pre-commit hooks** — catch issues before they're committed
5. **Run in CI** — enforce standards on every PR
6. **Yoda conditions** — `if ( 'value' === $var )` prevents accidental assignment
7. **Prefix everything** — functions, hooks, options, meta keys, script handles
8. **Tab indentation** — WordPress uses tabs, not spaces (unlike PSR-2)
9. **Document with PHPDoc** — `@param`, `@return`, `@since`, `@access`
10. **Check PHP compatibility** — PHPCompatibilityWP catches issues with min PHP version
