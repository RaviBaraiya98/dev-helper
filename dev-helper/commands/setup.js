const chalk = require('chalk');
const { detectAll } = require('../detectors');
const { runChecks, Status, summarizeResults } = require('../checkers');
const systemChecks = require('../checkers/system');
const { runCommand } = require('../utils/runner');
const { success, error, warning, info, header } = require('../utils/output');

/**
 * dev-helper setup
 * 
 * Detects project type, checks environment/runtime, validates dependencies,
 * checks configurations, and explains any issues found with fix steps.
 */
async function setup(options = {}) {
  console.log(chalk.cyan('\n🔍 Analyzing your development environment...\n'));

  const allIssues = [];
  const allFixes = [];

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: System & Developer Tools Check
  // ═══════════════════════════════════════════════════════════════════
  
  header('Developer Tools');

  const toolChecks = [
    { cmd: 'git --version', name: 'Git', required: true },
    { cmd: 'node --version', name: 'Node.js', required: false },
    { cmd: 'npm --version', name: 'npm', required: false },
    { cmd: 'python --version', name: 'Python', required: false },
    { cmd: 'java -version', name: 'Java', required: false },
  ];

  for (const tool of toolChecks) {
    const result = await runCommand(tool.cmd);
    if (result.success) {
      const output = result.stdout || result.stderr || '';
      const version = output.match(/[\d]+\.[\d]+\.[\d]+/)?.[0] || output.trim().split('\n')[0] || 'unknown';
      success(`${tool.name} installed (v${version})`);
    } else if (tool.required) {
      error(`${tool.name} not installed`);
      allIssues.push(`${tool.name} is not installed`);
      allFixes.push(getToolInstallFix(tool.name));
    } else if (options.verbose) {
      info(`${tool.name} not installed (optional)`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Git Configuration Check
  // ═══════════════════════════════════════════════════════════════════
  
  console.log('');
  header('Git Configuration');

  const gitName = await runCommand('git config --global user.name');
  const gitEmail = await runCommand('git config --global user.email');

  const gitNameValue = (gitName.stdout || '').trim();
  const gitEmailValue = (gitEmail.stdout || '').trim();

  if (gitName.success && gitNameValue) {
    success(`Git user.name: ${gitNameValue}`);
  } else {
    warning('Git user.name not configured');
    allIssues.push('Git user.name not configured');
    allFixes.push('git config --global user.name "Your Name"');
  }

  if (gitEmail.success && gitEmailValue) {
    success(`Git user.email: ${gitEmailValue}`);
  } else {
    warning('Git user.email not configured');
    allIssues.push('Git user.email not configured');
    allFixes.push('git config --global user.email "you@example.com"');
  }

  // Check if we're in a Git repo
  const gitStatus = await runCommand('git status');
  if (gitStatus.success) {
    success('Git repository detected');
  } else {
    info('Not a Git repository (run `git init` to initialize)');
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Project Detection & Analysis
  // ═══════════════════════════════════════════════════════════════════
  
  console.log('');
  header('Project Analysis');

  const detectedProjects = detectAll(process.cwd());

  if (detectedProjects.length === 0) {
    info('No recognized project type detected in this folder');
    info('Supported: Node.js, Python, Java, Go, Rust, .NET, PHP, C/C++, Flutter, Docker');
    console.log('');
  } else {
    // Run checks for each detected project
    for (const result of detectedProjects) {
      const { detector, analysis, checks } = result;
      const dir = process.cwd();
      
      console.log('');
      const projectName = analysis.projectName ? ` (${analysis.projectName})` : '';
      const framework = analysis.framework ? ` + ${analysis.framework}` : '';
      console.log(chalk.white.bold(`  📦 ${analysis.name || detector.name}${framework} Project${projectName}`));
      console.log('');

      // Run the detector's built-in checks
      if (checks && checks.length > 0) {
        for (const checkDef of checks) {
          try {
            // Execute the check function
            const passed = checkDef.check ? checkDef.check(dir) : true;
            const checkName = checkDef.name || checkDef.id || 'Check';
            
            if (passed) {
              // Get version if available
              let label = checkName;
              if (checkDef.getVersion) {
                const version = checkDef.getVersion();
                if (version) label = `${checkName} (v${version})`;
              } else if (checkDef.getScript) {
                const script = checkDef.getScript(dir);
                if (script) label = `${checkName} → ${script}`;
              }
              success(label);
            } else {
              error(checkName);
              // Get fix instruction
              let fix = '';
              if (typeof checkDef.fix === 'function') {
                fix = checkDef.fix(analysis, dir) || '';
              } else {
                fix = checkDef.fix || '';
              }
              if (fix) {
                console.log(chalk.gray(`     → Fix: ${fix}`));
                allIssues.push(checkName);
                allFixes.push(fix);
              }
            }
          } catch (e) {
            // Skip failed checks silently
          }
        }
      } else {
        // Show basic info if no checks defined
        success(`Detected ${analysis.name || detector.name} project`);
        if (analysis.hasDependencies !== undefined) {
          if (analysis.hasDependencies) {
            success('Dependencies installed');
          } else {
            error('Dependencies not installed');
            const setupCmd = detector.getSetupCommands?.()[0] || 'Install dependencies';
            allIssues.push('Dependencies not installed');
            allFixes.push(setupCmd);
          }
        }
      }

      // Show setup commands if available
      if (detector.getSetupCommands && options.verbose) {
        const setupCmds = detector.getSetupCommands();
        if (setupCmds && setupCmds.length > 0) {
          console.log('');
          console.log(chalk.gray('  Setup commands:'));
          setupCmds.forEach(cmd => {
            console.log(chalk.gray(`    $ ${cmd}`));
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Summary & Fix Instructions
  // ═══════════════════════════════════════════════════════════════════
  
  console.log('');
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  console.log('');

  if (allIssues.length === 0) {
    console.log(chalk.green.bold('  ✅ Environment is ready! No issues found.\n'));
  } else {
    console.log(chalk.red.bold(`  ❌ Found ${allIssues.length} issue(s) that need attention\n`));

    // Explain issues and provide fixes
    console.log(chalk.yellow.bold('  📋 Issues & How to Fix:\n'));

    allIssues.forEach((issue, index) => {
      console.log(chalk.white(`  ${index + 1}. ${issue}`));
      
      // Explain why this is a problem
      const explanation = getIssueExplanation(issue);
      if (explanation) {
        console.log(chalk.gray(`     Why: ${explanation}`));
      }
      
      // Show fix
      if (allFixes[index]) {
        console.log(chalk.cyan(`     Fix: ${allFixes[index]}`));
      }
      console.log('');
    });

    // Quick copy-paste section
    console.log(chalk.yellow.bold('  ⚡ Quick Fix Commands:\n'));
    const uniqueFixes = [...new Set(allFixes.filter(f => f))];
    uniqueFixes.forEach(fix => {
      console.log(chalk.white(`    ${fix}`));
    });
    console.log('');
  }
}

/**
 * Get installation instructions for common tools
 */
function getToolInstallFix(toolName) {
  const fixes = {
    'Git': 'Download from https://git-scm.com/downloads',
    'Node.js': 'Download from https://nodejs.org/',
    'Python': 'Download from https://python.org/downloads/',
    'Java': 'Download from https://adoptium.net/',
    'Docker': 'Download from https://docker.com/get-started',
  };
  return fixes[toolName] || `Install ${toolName}`;
}

/**
 * Get human-readable explanation for common issues
 */
function getIssueExplanation(issue) {
  const explanations = {
    'Git is not installed': 'Git is required for version control and collaborating with others.',
    'Git user.name not configured': 'Git needs your name to label your commits.',
    'Git user.email not configured': 'Git needs your email for commit attribution.',
    'Dependencies not installed': 'The project needs its libraries/packages to run.',
    'Start script not defined': 'There is no script defined to run this project.',
    'Environment file missing': 'The project may need configuration values (API keys, etc).',
  };

  for (const [key, value] of Object.entries(explanations)) {
    if (issue.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}

module.exports = setup;
