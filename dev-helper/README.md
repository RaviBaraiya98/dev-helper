# dev-helper

A **beginner-friendly CLI tool** that helps developers set up projects and understand errors.

## 🎯 What is this?

`dev-helper` solves two common developer problems:

1. **"How do I run this project?"** - Check environment, detect project type, validate dependencies
2. **"What does this error mean?"** - Explain Git, runtime, and build errors in plain English

## ✨ Features

- 🔍 **Smart Project Detection** - Auto-detects 10+ project types
- 🔀 **Error Translation** - Git, runtime, and build errors explained simply
- 🛠️ **Actionable Fixes** - Every issue comes with step-by-step solutions
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux

## 📦 Installation

```bash
npm install -g dev-helper
```

## 🚀 Commands

### `dev-helper setup`

Checks your development environment and project setup:

```bash
dev-helper setup
```

**What it checks:**
- Developer tools (Git, Node.js, Python, Java, etc.)
- Git configuration (user.name, user.email)
- Project type detection
- Dependencies installed
- Configuration files
- Build/run readiness

**Example output:**
```
🔍 Analyzing your development environment...

  Developer Tools
✔ Git installed (v2.49.0)
✔ Node.js installed (v22.14.0)
✔ npm installed (v11.4.2)

  Git Configuration
✔ Git user.name: Your Name
✔ Git user.email: you@example.com
✔ Git repository detected

  Project Analysis
  📦 Node.js Project (my-app)
✔ Node.js installed (v22.14.0)
✔ npm installed (v11.4.2)
✔ Dependencies installed
✔ Start script defined

  ✅ Environment is ready! No issues found.
```

---

### `dev-helper explain`

Explains errors you encounter in plain English:

```bash
dev-helper explain
```

**What it explains:**
- Git errors (merge conflicts, detached HEAD, push rejected, etc.)
- Runtime errors (missing dependencies, no virtual environment)
- Build errors (multiple lock files, missing node_modules)
- System errors (permissions, port conflicts)

**Example output:**
```
🔍 Analyzing for errors...

  🔀 Merge Conflict

  What happened:
    Git tried to merge changes but found conflicting edits in the same place.

  Why this happened:
    Two branches modified the same lines of code differently.

  How to fix:
    # 1. Open the conflicting files and look for:
    #    <<<<<<< HEAD
    #    your changes
    #    =======
    #    their changes
    #    >>>>>>> branch-name

    # 2. Edit the file to keep what you want
    # 3. Remove the conflict markers
    # 4. Stage and commit:
    git add .
    git commit -m "Resolved merge conflicts"
```

## 🎯 Supported Languages & Frameworks

| Language | Detection | Package Manager | Frameworks |
|----------|-----------|-----------------|------------|
| **Node.js** | `package.json` | npm, yarn, pnpm, bun | React, Next.js, Vue, Angular, Express, Vite |
| **Python** | `requirements.txt`, `pyproject.toml` | pip, poetry, pipenv | Django, Flask, FastAPI |
| **Java** | `pom.xml`, `build.gradle` | Maven, Gradle | Spring Boot |
| **Go** | `go.mod` | go modules | - |
| **Rust** | `Cargo.toml` | cargo | - |
| **.NET** | `*.csproj`, `*.sln` | dotnet, NuGet | ASP.NET |
| **PHP** | `composer.json` | composer | Laravel, Symfony |
| **C/C++** | `CMakeLists.txt`, `Makefile` | cmake, make | - |
| **Flutter** | `pubspec.yaml` | pub, flutter | - |
| **Docker** | `Dockerfile`, `docker-compose.yml` | docker | - |

## 🔀 Supported Errors

`dev-helper explain` understands:

- Not a git repository
- Detached HEAD state
- Merge conflicts
- Push rejected (non-fast-forward)
- No upstream branch configured
- Permission denied (SSH key issues)
- Branches have diverged
- Rebase in progress
- Uncommitted changes blocking operations
- Stash errors
- Submodule issues
- LFS problems
- And many more...

## 🧪 Local Development & Testing

### Clone and install dependencies

```bash
git clone https://github.com/your-username/dev-helper.git
cd dev-helper
npm install
```

### Test locally using npm link

```bash
# In the dev-helper directory
npm link

# Now you can use dev-helper globally
dev-helper --help
dev-helper setup
dev-helper explain

# To unlink when done testing
npm unlink -g dev-helper
```

### Test in a sample project

```bash
# Create a test Node.js project
mkdir test-project
cd test-project
npm init -y

# Run setup
dev-helper setup
```

## 📁 Project Structure

```
dev-helper/
├── bin/
│   └── index.js              # CLI entry point
├── commands/
│   ├── setup.js              # setup command
│   └── explain.js            # explain command
├── detectors/
│   ├── base.js               # Base detector class
│   ├── index.js              # Detector registry
│   ├── nodejs.js             # Node.js detector
│   ├── python.js             # Python detector
│   ├── java.js               # Java detector
│   ├── go.js                 # Go detector
│   ├── rust.js               # Rust detector
│   ├── dotnet.js             # .NET detector
│   ├── php.js                # PHP detector
│   ├── cpp.js                # C/C++ detector
│   ├── flutter.js            # Flutter detector
│   └── docker.js             # Docker detector
├── checkers/
│   ├── index.js              # Check runner
│   └── system.js             # System checks
├── fixes/
│   └── index.js              # Fix suggestions
├── git/
│   ├── analyzer.js           # Git state analyzer
│   ├── errors.js             # Error pattern matching
│   └── recovery.js           # Recovery suggestions
├── utils/
│   ├── detector.js           # Legacy detector (wrapper)
│   ├── output.js             # Colored output helpers
│   ├── platform.js           # Cross-platform utils
│   ├── runner.js             # Command execution
│   └── version.js            # Version parsing
├── data/
│   └── gitErrors.json        # Git error database (20+ patterns)
├── package.json
├── CHANGELOG.md
└── README.md
```

## 📤 Publishing to npm

### 1. Create an npm account

Sign up at [npmjs.com](https://www.npmjs.com)

### 2. Login to npm

```bash
npm login
```

### 3. Update package.json

Make sure to update:
- `name` - Must be unique on npm (try `@your-username/dev-helper` if taken)
- `author` - Your name
- `repository.url` - Your GitHub repo URL

### 4. Publish

```bash
# First time
npm publish

# For scoped packages (@username/package-name)
npm publish --access public
```

### 5. Update version for new releases

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major

# Then publish
npm publish
```

## 🤝 Contributing

Contributions are welcome! Here are ways to help:

### 1. Add a New Language Detector

Create a new file in `detectors/` extending `BaseDetector`:

```javascript
const BaseDetector = require('./base');

class RubyDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Ruby';
    this.icon = '💎';
  }

  detect(files) {
    return files.includes('Gemfile');
  }

  async check() {
    const results = [];
    
    // Check Ruby installation
    results.push(await this.checkCommand('ruby --version', 'Ruby'));
    
    // Check Bundler
    results.push(await this.checkCommand('bundle --version', 'Bundler'));
    
    return results;
  }

  getSetupCommands() {
    return ['bundle install'];
  }
}

module.exports = RubyDetector;
```

Then register it in `detectors/index.js`.

### 2. Add More Git Error Patterns

Edit `data/gitErrors.json`:

```json
{
  "pattern": "regex pattern to match",
  "title": "Human-readable title",
  "explanation": "What happened in plain English",
  "reason": "Why this happened",
  "fixes": [
    "step 1",
    "step 2"
  ],
  "warning": "Optional safety warning",
  "learnMore": "https://link-to-docs"
}
```

### 3. Improve Cross-Platform Support

Check `utils/platform.js` for platform-specific code paths.

## 📄 License

MIT

## 🙏 Acknowledgments

Built for:
- 🎓 **Students** learning Git and project setup
- 🚀 **Hackathon teams** quickly debugging environments
- 🌍 **Open-source contributors** joining new projects
- 💻 **Production engineers** diagnosing development setups

---

**dev-helper v2.0.0** - Made with ❤️ for developers everywhere
