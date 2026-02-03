const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { runCommand } = require('../utils/runner');
const { success, error, warning, info, header } = require('../utils/output');
const gitErrors = require('../data/gitErrors.json');

/**
 * dev-helper explain
 * 
 * Explains Git errors, runtime errors, build errors, and system errors
 * in plain English with safe fix steps.
 */
async function explain(options = {}) {
  console.log(chalk.cyan('\n🔍 Analyzing for errors...\n'));

  // Try to detect and explain errors in order of likelihood
  let errorFound = false;

  // ═══════════════════════════════════════════════════════════════════
  // 1. Check Git Status & Errors
  // ═══════════════════════════════════════════════════════════════════
  
  const gitError = await checkGitErrors(options);
  if (gitError) {
    displayError(gitError);
    errorFound = true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. Check for Common Runtime/Build Errors
  // ═══════════════════════════════════════════════════════════════════
  
  if (!errorFound) {
    const runtimeError = await checkRuntimeErrors(options);
    if (runtimeError) {
      displayError(runtimeError);
      errorFound = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. Check for Permission/Port/Path Errors
  // ═══════════════════════════════════════════════════════════════════
  
  if (!errorFound) {
    const systemError = await checkSystemErrors(options);
    if (systemError) {
      displayError(systemError);
      errorFound = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // No errors found - provide guidance
  // ═══════════════════════════════════════════════════════════════════
  
  if (!errorFound) {
    console.log(chalk.green('  ✅ No obvious errors detected in this folder.\n'));
    console.log(chalk.white('  If you encountered an error elsewhere:\n'));
    console.log(chalk.gray('    1. Copy the exact error message'));
    console.log(chalk.gray('    2. Navigate to the folder where the error occurred'));
    console.log(chalk.gray('    3. Run `dev-helper explain` again'));
    console.log(chalk.gray('    4. Or run `dev-helper setup` to check your environment\n'));
    console.log(chalk.white('  If you still can\'t resolve the error:\n'));
    console.log(chalk.gray('    • Search the error message online'));
    console.log(chalk.gray('    • Check the project\'s README or documentation'));
    console.log(chalk.gray('    • Ask for help on Stack Overflow or project forums\n'));
  }
}

/**
 * Check for Git-related errors
 */
async function checkGitErrors(options) {
  const cwd = process.cwd();
  const files = fs.existsSync(cwd) ? fs.readdirSync(cwd) : [];
  
  // Only flag "not a git repo" if there are project files present
  const projectIndicators = [
    'package.json', 'requirements.txt', 'pyproject.toml', 'pom.xml', 
    'build.gradle', 'Cargo.toml', 'go.mod', 'composer.json', 'Gemfile',
    'Makefile', 'CMakeLists.txt', 'pubspec.yaml', 'Dockerfile'
  ];
  const hasProjectFiles = files.some(f => projectIndicators.includes(f));
  
  // Check if we're in a git repo
  const gitCheck = await runCommand('git rev-parse --git-dir');
  
  if (!gitCheck.success) {
    // Only show this error if there are project files (likely should be a repo)
    if (hasProjectFiles) {
      return {
        title: 'Not a Git Repository',
        explanation: 'This folder contains project files but is not being tracked by Git.',
        reason: 'The project was created without Git, or the .git folder was deleted.',
        fixes: [
          '# To start tracking this project with Git:',
          'git init',
          'git add .',
          'git commit -m "Initial commit"'
        ],
        category: 'git'
      };
    }
    // If no project files, this is likely not an error - just skip
    return null;
  }

  // Check for detached HEAD
  const headCheck = await runCommand('git symbolic-ref HEAD');
  if (!headCheck.success) {
    const commitHash = (await runCommand('git rev-parse --short HEAD')).stdout?.trim() || 'unknown';
    return {
      title: 'Detached HEAD State',
      explanation: `You're not on any branch - you're viewing commit ${commitHash} directly. Any new commits won't belong to a branch.`,
      reason: 'This happens when you checkout a specific commit, tag, or remote branch directly.',
      fixes: [
        '# To get back to a branch:',
        'git checkout main',
        '',
        '# To create a new branch from here:',
        'git checkout -b new-branch-name',
        '',
        '# To see where you came from:',
        'git reflog'
      ],
      warning: 'If you made commits in detached HEAD, create a branch first or they may be lost!',
      category: 'git'
    };
  }

  // Check for merge conflicts
  const statusResult = await runCommand('git status');
  if (statusResult.success) {
    const status = statusResult.stdout || '';

    if (status.includes('Unmerged paths') || status.includes('both modified')) {
      return {
        title: 'Merge Conflict',
        explanation: 'Git tried to merge changes but found conflicting edits in the same place. You need to manually choose which changes to keep.',
        reason: 'Two branches modified the same lines of code differently.',
        fixes: [
          '# 1. Open the conflicting files and look for:',
          '#    <<<<<<< HEAD',
          '#    your changes',
          '#    =======',
          '#    their changes',
          '#    >>>>>>> branch-name',
          '',
          '# 2. Edit the file to keep what you want',
          '# 3. Remove the conflict markers',
          '# 4. Stage and commit:',
          'git add .',
          'git commit -m "Resolved merge conflicts"'
        ],
        category: 'git'
      };
    }

    if (status.includes('rebase in progress')) {
      return {
        title: 'Rebase in Progress',
        explanation: 'A rebase operation was started but not finished. Git is waiting for you to resolve conflicts or continue.',
        reason: 'You ran `git rebase` and it encountered conflicts, or was interrupted.',
        fixes: [
          '# To continue after resolving conflicts:',
          'git rebase --continue',
          '',
          '# To skip this commit and continue:',
          'git rebase --skip',
          '',
          '# To abort and go back to before the rebase:',
          'git rebase --abort'
        ],
        warning: 'If unsure, `git rebase --abort` is the safest option.',
        category: 'git'
      };
    }

    if (status.includes('Changes not staged') || status.includes('Changes to be committed')) {
      // Not really an error, but helpful info
      if (options.verbose) {
        return {
          title: 'Uncommitted Changes',
          explanation: 'You have changes that haven\'t been committed yet.',
          reason: 'You\'ve modified files but haven\'t saved them to Git history.',
          fixes: [
            '# To save your changes:',
            'git add .',
            'git commit -m "Your message"',
            '',
            '# To temporarily store changes:',
            'git stash',
            '',
            '# To discard all changes (careful!):',
            'git checkout .'
          ],
          category: 'git'
        };
      }
    }
  }

  // Check for upstream issues
  const upstream = await runCommand('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
  if (!upstream.success && (upstream.stderr?.includes('no upstream') || upstream.stdout?.includes('no upstream'))) {
    const branchResult = await runCommand('git branch --show-current');
    const currentBranch = branchResult.stdout?.trim() || 'current-branch';
    return {
      title: 'No Upstream Branch',
      explanation: 'This local branch isn\'t connected to any remote branch yet. Git doesn\'t know where to push.',
      reason: 'You created a new branch locally but haven\'t pushed it to the remote yet.',
      fixes: [
        `# Set upstream and push:`,
        `git push -u origin ${currentBranch}`
      ],
      category: 'git'
    };
  }

  // Check if branches have diverged
  const diverged = await runCommand('git status -sb');
  if (diverged.success && diverged.stdout?.includes('ahead') && diverged.stdout?.includes('behind')) {
    return {
      title: 'Branches Have Diverged',
      explanation: 'Your local branch and the remote branch have different commits. They need to be reconciled.',
      reason: 'You made commits locally while someone else pushed to the same remote branch.',
      fixes: [
        '# Safest option - merge remote changes:',
        'git pull',
        '',
        '# Alternative - rebase your changes on top:',
        'git pull --rebase'
      ],
      warning: 'Don\'t use `git push --force` unless you understand the consequences!',
      category: 'git'
    };
  }

  return null;
}

/**
 * Check for runtime and build errors
 */
async function checkRuntimeErrors(options) {
  const cwd = process.cwd();
  const files = fs.existsSync(cwd) ? fs.readdirSync(cwd) : [];

  // Node.js project checks
  if (files.includes('package.json')) {
    // Check if node_modules exists
    if (!files.includes('node_modules')) {
      return {
        title: 'Node Modules Missing',
        explanation: 'The project dependencies are not installed. The project cannot run without them.',
        reason: 'You cloned or downloaded the project but didn\'t install the packages.',
        fixes: [
          '# Install dependencies:',
          'npm install',
          '',
          '# Or if using yarn:',
          'yarn install'
        ],
        category: 'runtime'
      };
    }

    // Check for package-lock issues
    if (files.includes('package-lock.json') && files.includes('yarn.lock')) {
      return {
        title: 'Multiple Lock Files',
        explanation: 'This project has both npm and yarn lock files, which can cause inconsistent dependencies.',
        reason: 'Different developers used different package managers.',
        fixes: [
          '# Choose one and delete the other:',
          '# If using npm, delete yarn.lock',
          '# If using yarn, delete package-lock.json',
          '',
          '# Then reinstall:',
          'npm install  # or yarn install'
        ],
        category: 'build'
      };
    }
  }

  // Python project checks
  if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
    // Check for virtual environment
    if (!files.includes('venv') && !files.includes('.venv') && !files.includes('env')) {
      return {
        title: 'No Virtual Environment',
        explanation: 'Python projects should use a virtual environment to isolate dependencies.',
        reason: 'A virtual environment prevents conflicts between different projects.',
        fixes: [
          '# Create a virtual environment:',
          'python -m venv venv',
          '',
          '# Activate it:',
          '# Windows:',
          'venv\\Scripts\\activate',
          '# Mac/Linux:',
          'source venv/bin/activate',
          '',
          '# Then install dependencies:',
          'pip install -r requirements.txt'
        ],
        category: 'runtime'
      };
    }
  }

  return null;
}

/**
 * Check for system-level errors (permissions, ports, paths)
 */
async function checkSystemErrors(options) {
  const cwd = process.cwd();

  // Check if current directory is accessible
  try {
    fs.accessSync(cwd, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    return {
      title: 'Permission Denied',
      explanation: 'You don\'t have read/write access to this folder.',
      reason: 'The folder permissions don\'t allow your user account to modify files.',
      fixes: [
        '# On Mac/Linux:',
        `sudo chown -R $USER ${cwd}`,
        '',
        '# On Windows (run as Administrator):',
        '# Right-click folder → Properties → Security → Edit'
      ],
      category: 'system'
    };
  }

  // Check for common port conflicts (if there's a config file)
  const envFile = path.join(cwd, '.env');
  if (fs.existsSync(envFile)) {
    try {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const portMatch = envContent.match(/PORT\s*=\s*(\d+)/);
      if (portMatch) {
        const port = portMatch[1];
        const portCheck = await runCommand(process.platform === 'win32' 
          ? `netstat -ano | findstr :${port}`
          : `lsof -i :${port}`);
        
        if (portCheck.success && (portCheck.stdout || '').trim()) {
          return {
            title: `Port ${port} Already in Use`,
            explanation: `The port your app wants to use (${port}) is already taken by another process.`,
            reason: 'Another application or a previous instance of your app is using this port.',
            fixes: [
              `# Find what's using port ${port}:`,
              process.platform === 'win32' 
                ? `netstat -ano | findstr :${port}` 
                : `lsof -i :${port}`,
              '',
              '# Kill the process (replace PID):',
              process.platform === 'win32' 
                ? 'taskkill /PID <PID> /F' 
                : 'kill -9 <PID>',
              '',
              '# Or change the port in .env file'
            ],
            category: 'system'
          };
        }
      }
    } catch (e) {
      // Ignore .env read errors
    }
  }

  return null;
}

/**
 * Display an error with explanation and fixes
 * Format is ALWAYS:
 *   ❌ Error detected
 *   What it means: <plain English>
 *   Why it happened: <root cause>
 *   How to fix: <safe steps>
 */
function displayError(err) {
  // Always start with the error indicator
  console.log(chalk.red.bold(`  ❌ Error detected\n`));
  
  // Error title/category
  const categoryLabels = {
    git: 'Git Error',
    runtime: 'Runtime Error',
    build: 'Build Error',
    system: 'System Error',
    dependency: 'Dependency Error',
    config: 'Configuration Error',
    permission: 'Permission Error',
    unknown: 'Unknown Error'
  };
  
  const categoryLabel = categoryLabels[err.category] || 'Error';
  console.log(chalk.white.bold(`  ${categoryLabel}: ${err.title}\n`));

  // What it means (required)
  console.log(chalk.yellow('  What it means:'));
  console.log(chalk.white(`    ${err.explanation}\n`));

  // Why it happened (required)
  console.log(chalk.yellow('  Why it happened:'));
  if (err.reason) {
    console.log(chalk.white(`    ${err.reason}\n`));
  } else {
    console.log(chalk.white(`    The exact cause could not be determined.\n`));
  }

  // How to fix (required)
  console.log(chalk.yellow('  How to fix:'));
  if (err.fixes && err.fixes.length > 0) {
    err.fixes.forEach(line => {
      if (line.startsWith('#')) {
        console.log(chalk.gray(`    ${line}`));
      } else if (line === '') {
        console.log('');
      } else {
        console.log(chalk.cyan(`    ${line}`));
      }
    });
  } else {
    console.log(chalk.gray('    No automatic fix available.'));
    console.log(chalk.gray('    Search the error message online for solutions.'));
  }

  // Warning for dangerous operations (if applicable)
  if (err.warning) {
    console.log('');
    console.log(chalk.red.bold(`  ⚠️  WARNING: ${err.warning}`));
  }

  console.log('');
}

module.exports = explain;
