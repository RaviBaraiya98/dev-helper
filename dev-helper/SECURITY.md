# Security Model - dev-helper

## Overview

**dev-helper is a READ-ONLY ANALYZER.** It inspects your development environment and project configurations without ever executing project code.

This document describes the security architecture that ensures dev-helper is safe to run in any environment, including:
- Production servers
- Student projects
- Critical systems
- CI/CD pipelines

---

## Non-Negotiable Safety Rules

### ❌ dev-helper MUST NEVER:

| Category | Forbidden Actions |
|----------|------------------|
| **Code Execution** | Run `npm start`, `npm run`, `node`, `python`, `java`, `go run`, `cargo run`, etc. |
| **Package Installation** | Run `npm install`, `pip install`, `composer install`, `cargo fetch`, etc. |
| **Build Commands** | Run `npm run build`, `mvn compile`, `gradle build`, `make`, etc. |
| **Server Operations** | Start servers, open ports, or listen for connections |
| **File Modifications** | Create, modify, or delete any files in the project |
| **User Scripts** | Execute any scripts defined in package.json, Makefile, or similar |

### ✅ dev-helper MAY ONLY:

| Category | Allowed Actions |
|----------|----------------|
| **File Reading** | Read package.json, requirements.txt, pom.xml, Cargo.toml, etc. |
| **Directory Inspection** | Check if directories exist (node_modules, venv, target, etc.) |
| **Version Checks** | Run `git --version`, `node --version`, `python --version`, etc. |
| **Config Queries** | Run `git config --global user.name`, `git config --global user.email` |
| **Tool Existence** | Run `where`/`which` to check if tools are installed |
| **Status Checks** | Run `git status`, `docker info` (read-only queries) |

---

## Architecture

### Safety Module (`utils/safety.js`)

The safety module is the core of the security architecture. It defines:

1. **SAFE_COMMAND_PATTERNS**: An explicit allowlist of commands that can be executed
2. **DANGEROUS_COMMAND_PATTERNS**: Commands that are blocked even if they match the allowlist (defense in depth)
3. **isCommandSafe()**: Validates commands before execution
4. **assertCommandSafe()**: Throws an error if a command is unsafe

### Safe Command Execution (`utils/runner.js`)

All command execution flows through `safeRunCommand()`:

```javascript
function safeRunCommand(command, options = {}) {
  const safetyCheck = isCommandSafe(command);
  
  if (!safetyCheck.safe) {
    // Command is blocked - return failure without execution
    return {
      success: false,
      blocked: true,
      stderr: `[SAFETY] Command blocked: ${safetyCheck.reason}`
    };
  }

  return _executeCommand(command, options);
}
```

### Principle: Allowlist, Not Blocklist

The security model uses an **allowlist** approach:
- Only commands explicitly listed in `SAFE_COMMAND_PATTERNS` can execute
- Everything else is blocked by default
- This prevents unknown dangerous commands from slipping through

---

## Allowed Commands (Complete List)

### Version Checks
```
git --version
node --version, node -v
npm --version, npm -v
python --version, python -V
python3 --version, python3 -V
java -version, java --version
javac -version, javac --version
go version
rustc --version
cargo --version
dotnet --version
php --version, php -v
composer --version
flutter --version
dart --version
docker --version, docker -v
mvn --version, mvn -v
gradle --version, gradle -v
cmake --version
make --version
gcc --version
g++ --version
clang --version
pip --version
pip3 --version
poetry --version
pipenv --version
yarn --version
pnpm --version
bun --version
```

### Tool Existence
```
where <tool>      (Windows)
which <tool>      (Unix/Mac)
command -v <tool> (POSIX)
```

### Git Read-Only
```
git config --global user.name
git config --global user.email
git config --global init.defaultBranch
git config --get <key>
git status
git status --porcelain
git rev-parse --git-dir
git rev-parse --is-inside-work-tree
git branch --show-current
```

### Docker Read-Only
```
docker info
docker ps
```

---

## Blocked Commands (Examples)

### Node.js
- `node app.js` ❌
- `npm start` ❌
- `npm run dev` ❌
- `npm install` ❌
- `npx anything` ❌

### Python
- `python app.py` ❌
- `pip install package` ❌
- `poetry run` ❌

### Java
- `java -jar app.jar` ❌
- `mvn spring-boot:run` ❌
- `./gradlew bootRun` ❌

### Docker
- `docker run` ❌
- `docker-compose up` ❌
- `docker build` ❌

### Shell
- Any command with `|`, `&`, `;`, `>` ❌
- Any command with `$()` or backticks ❌
- `sudo` anything ❌
- `rm`, `cp`, `mv`, `mkdir` ❌

---

## Error Handling Policy

When dev-helper detects an issue:

1. **Explain the problem** in simple language
2. **Explain why** it happened
3. **Provide safe, manual fix steps**
4. **NEVER auto-fix** by executing commands

Example output:
```
❌ Dependencies not installed
   Why: The project needs its libraries/packages to run.
   Fix: npm install

⚡ Quick Fix Commands (run these manually):
    npm install

ℹ️  dev-helper is read-only and will not run these commands for you.
```

---

## Defense in Depth

The security model uses multiple layers of protection:

1. **Allowlist**: Only explicitly safe commands can run
2. **Blocklist**: Known dangerous patterns are explicitly blocked
3. **Input Validation**: Command strings are validated before execution
4. **Timeout**: All commands have a 10-second timeout
5. **Silent Mode**: Commands run without terminal access
6. **No Shell Features**: Command chaining and substitution are blocked

---

## Testing Safety

To verify the safety implementation:

```bash
# Set debug mode to see blocked commands
set DEV_HELPER_DEBUG=true

# Run in any project directory
dev-helper setup
```

Expected behavior:
- ✅ Tool versions are detected
- ✅ Git configuration is read
- ✅ Project type is detected
- ❌ No servers start
- ❌ No dependencies are installed
- ❌ No build commands run
- ❌ No files are modified

---

## Contributing

When adding new features to dev-helper:

1. **NEVER** add commands to the allowlist that could execute user code
2. **ALWAYS** prefer file system reads over command execution
3. **DOCUMENT** any new allowed commands in this file
4. **TEST** that your changes don't cause side effects

### Code Review Checklist

- [ ] Does the change add any new `runCommand` or `safeRunCommand` calls?
- [ ] Are all new commands on the existing allowlist?
- [ ] Could any new command execute user project code?
- [ ] Is the change tested in Node.js, Python, and Java projects?
- [ ] Does running `dev-helper setup` in a server project remain safe?

---

## Reporting Security Issues

If you discover a way for dev-helper to execute user code or cause side effects, please report it immediately by:

1. Opening a GitHub issue with the `security` label
2. Providing a minimal reproduction case
3. NOT publishing exploits publicly until fixed

---

## Version History

| Version | Changes |
|---------|---------|
| 2.2.0 | Implemented allowlist-based command execution |
| 2.2.0 | Added safety.js module with SAFE_COMMAND_PATTERNS |
| 2.2.0 | Replaced all runCommand with safeRunCommand |
| 2.2.0 | Added comprehensive safety documentation |
