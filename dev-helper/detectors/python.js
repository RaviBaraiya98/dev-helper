const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion, runCommand } = require('../utils/runner');
const { extractVersion } = require('../utils/version');
const { isWindows, getVenvActivateCommand } = require('../utils/platform');

class PythonDetector extends BaseDetector {
  constructor() {
    super();
    this.name = 'Python';
    this.type = 'python';
    this.configFiles = ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'];
    this.runtimeCommand = 'python';
    this.packageManagers = ['pip', 'pipenv', 'poetry', 'conda'];
  }

  detect(dir) {
    return fileExists('requirements.txt', dir) ||
           fileExists('pyproject.toml', dir) ||
           fileExists('setup.py', dir) ||
           fileExists('Pipfile', dir);
  }

  analyze(dir) {
    const result = {
      detected: true,
      name: this.name,
      type: this.type,
      projectName: this.detectProjectName(dir),
      framework: this.detectFramework(dir),
      packageManager: this.detectPackageManager(dir),
      hasVenv: this.detectVirtualEnv(dir),
      venvPath: this.getVenvPath(dir),
      configFile: this.getConfigFile(dir)
    };

    return result;
  }

  detectProjectName(dir) {
    // Try pyproject.toml first
    const pyproject = readFile('pyproject.toml', dir);
    if (pyproject) {
      const match = pyproject.match(/name\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    }
    
    // Try setup.py
    const setup = readFile('setup.py', dir);
    if (setup) {
      const match = setup.match(/name\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    }
    
    return 'unknown';
  }

  detectFramework(dir) {
    const requirements = readFile('requirements.txt', dir) || '';
    const pyproject = readFile('pyproject.toml', dir) || '';
    const combined = requirements + pyproject;

    if (combined.includes('django') || combined.includes('Django')) return 'Django';
    if (combined.includes('flask') || combined.includes('Flask')) return 'Flask';
    if (combined.includes('fastapi') || combined.includes('FastAPI')) return 'FastAPI';
    if (combined.includes('tornado')) return 'Tornado';
    if (combined.includes('pyramid')) return 'Pyramid';
    if (combined.includes('streamlit')) return 'Streamlit';
    if (combined.includes('jupyter')) return 'Jupyter';
    if (combined.includes('scrapy')) return 'Scrapy';

    // Check for ML/Data Science
    if (combined.includes('tensorflow') || combined.includes('keras')) return 'TensorFlow';
    if (combined.includes('pytorch') || combined.includes('torch')) return 'PyTorch';
    if (combined.includes('pandas') && combined.includes('numpy')) return 'Data Science';

    return null;
  }

  detectPackageManager(dir) {
    if (fileExists('poetry.lock', dir) || 
        (fileExists('pyproject.toml', dir) && readFile('pyproject.toml', dir)?.includes('[tool.poetry]'))) {
      return 'poetry';
    }
    if (fileExists('Pipfile', dir) || fileExists('Pipfile.lock', dir)) {
      return 'pipenv';
    }
    if (fileExists('environment.yml', dir) || fileExists('environment.yaml', dir)) {
      return 'conda';
    }
    return 'pip';
  }

  detectVirtualEnv(dir) {
    return directoryExists('venv', dir) ||
           directoryExists('.venv', dir) ||
           directoryExists('env', dir) ||
           directoryExists('.env', dir);
  }

  getVenvPath(dir) {
    if (directoryExists('venv', dir)) return 'venv';
    if (directoryExists('.venv', dir)) return '.venv';
    if (directoryExists('env', dir)) return 'env';
    return null;
  }

  getConfigFile(dir) {
    if (fileExists('requirements.txt', dir)) return 'requirements.txt';
    if (fileExists('pyproject.toml', dir)) return 'pyproject.toml';
    if (fileExists('Pipfile', dir)) return 'Pipfile';
    if (fileExists('setup.py', dir)) return 'setup.py';
    return null;
  }

  getPythonCommand() {
    // Try python3 first on Unix systems
    if (!isWindows && commandExists('python3')) return 'python3';
    if (commandExists('python')) return 'python';
    return null;
  }

  getChecks() {
    const self = this;
    return [
      {
        id: 'python-installed',
        name: 'Python installed',
        check: () => self.getPythonCommand() !== null,
        getVersion: () => {
          const cmd = self.getPythonCommand();
          if (!cmd) return null;
          const output = getCommandVersion(cmd);
          return extractVersion(output);
        },
        fix: 'Install Python from https://python.org'
      },
      {
        id: 'pip-installed',
        name: 'pip installed',
        check: () => commandExists('pip') || commandExists('pip3'),
        getVersion: () => {
          const output = getCommandVersion('pip') || getCommandVersion('pip3');
          return extractVersion(output);
        },
        fix: 'Install pip: python -m ensurepip --upgrade'
      },
      {
        id: 'venv-exists',
        name: 'Virtual environment',
        check: (dir) => self.detectVirtualEnv(dir),
        fix: (analysis) => {
          const cmd = self.getPythonCommand() || 'python';
          return `${cmd} -m venv venv`;
        }
      },
      {
        id: 'dependencies-installed',
        name: 'Dependencies installed',
        check: (dir, analysis) => {
          // This is a basic check - in reality we'd need to compare installed vs required
          return analysis.hasVenv;
        },
        fix: (analysis) => {
          switch (analysis.packageManager) {
            case 'poetry': return 'poetry install';
            case 'pipenv': return 'pipenv install';
            case 'conda': return 'conda env create -f environment.yml';
            default: return 'pip install -r requirements.txt';
          }
        }
      },
      {
        id: 'venv-activated',
        name: 'Virtual environment activated',
        check: () => {
          // Check if we're in a virtual environment
          return process.env.VIRTUAL_ENV !== undefined || 
                 process.env.CONDA_DEFAULT_ENV !== undefined;
        },
        fix: (analysis, dir) => getVenvActivateCommand(analysis.venvPath || 'venv'),
        warning: 'Run this command in your terminal before running the project'
      }
    ];
  }
}

module.exports = PythonDetector;
