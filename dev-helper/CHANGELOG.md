# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-02-03

### Changed
- **Simplified to 2 Commands** - `setup` and `explain` only
- `setup` now combines environment checks, project detection, and fix suggestions
- `explain` now handles Git, runtime, build, and system errors
- Removed `setup-check`, `git-explain`, and `doctor` commands
- Cleaner, more beginner-friendly output

### Removed
- `doctor` command (merged into `setup`)
- `setup-check` command (renamed to `setup`)
- `git-explain` command (renamed to `explain`)

## [2.0.0] - 2026-02-03

### Added
- **Plugin Architecture** - Extensible detector system with `BaseDetector` class
- **10 Language Detectors** - Node.js, Python, Java, Go, Rust, .NET, PHP, C/C++, Flutter, Docker
- **20+ Git Error Patterns** - Expanded database with detailed explanations
- **Cross-Platform Support** - Windows, macOS, and Linux utilities
- **Framework Detection** - React, Next.js, Vue, Angular, Django, Flask, Spring Boot, etc.
- **Package Manager Detection** - npm, yarn, pnpm, bun, pip, poetry, pipenv, Maven, Gradle, etc.

## [1.0.0] - 2026-02-03

### Added
- Initial release
- Basic project setup validation (Node.js, Python, Java)
- Git error explanations (10 patterns)
