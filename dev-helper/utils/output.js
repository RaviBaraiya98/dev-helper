const chalk = require('chalk');

/**
 * Output formatting utilities for consistent, beautiful CLI output
 */

const symbols = {
  success: process.platform === 'win32' ? '√' : '✔',
  error: process.platform === 'win32' ? '×' : '✖',
  warning: process.platform === 'win32' ? '!' : '⚠',
  info: process.platform === 'win32' ? 'i' : 'ℹ',
  arrow: process.platform === 'win32' ? '->' : '→',
  bullet: process.platform === 'win32' ? '*' : '•',
  search: process.platform === 'win32' ? '?' : '🔍',
  gear: process.platform === 'win32' ? '*' : '⚙',
  package: process.platform === 'win32' ? '+' : '📦',
  git: process.platform === 'win32' ? 'G' : '🔀',
  doctor: process.platform === 'win32' ? '+' : '🩺'
};

/**
 * Print a success message
 */
function success(message, detail = '') {
  const detailStr = detail ? chalk.gray(` (${detail})`) : '';
  console.log(chalk.green(`${symbols.success} ${message}`) + detailStr);
}

/**
 * Print an error message
 */
function error(message, detail = '') {
  const detailStr = detail ? chalk.gray(` (${detail})`) : '';
  console.log(chalk.red(`${symbols.error} ${message}`) + detailStr);
}

/**
 * Print a warning message
 */
function warning(message, detail = '') {
  const detailStr = detail ? chalk.gray(` (${detail})`) : '';
  console.log(chalk.yellow(`${symbols.warning} ${message}`) + detailStr);
}

/**
 * Print an info message
 */
function info(message, detail = '') {
  const detailStr = detail ? chalk.gray(` (${detail})`) : '';
  console.log(chalk.blue(`${symbols.info} ${message}`) + detailStr);
}

/**
 * Print a fix suggestion
 */
function fix(message) {
  console.log(chalk.cyan(`  ${symbols.arrow} Fix: ${message}`));
}

/**
 * Print a command suggestion
 */
function command(cmd, description = '') {
  if (description) {
    console.log(chalk.cyan(`  ${symbols.arrow} ${cmd}`) + chalk.gray(` # ${description}`));
  } else {
    console.log(chalk.cyan(`  ${symbols.arrow} ${cmd}`));
  }
}

/**
 * Print a section header
 */
function header(title, emoji = '') {
  const icon = emoji || symbols.search;
  console.log('');
  console.log(chalk.bold.cyan(`${icon} ${title}`));
  console.log('');
}

/**
 * Print a subheader
 */
function subheader(title) {
  console.log('');
  console.log(chalk.bold.white(`  ${title}`));
}

/**
 * Print a divider line
 */
function divider() {
  console.log(chalk.gray('  ' + '─'.repeat(50)));
}

/**
 * Print a blank line
 */
function blank() {
  console.log('');
}

/**
 * Print a list item
 */
function listItem(text, indent = 2) {
  console.log(' '.repeat(indent) + chalk.gray(`${symbols.bullet} ${text}`));
}

/**
 * Print a code block
 */
function code(text) {
  console.log(chalk.gray('  ```'));
  text.split('\n').forEach(line => {
    console.log(chalk.white(`  ${line}`));
  });
  console.log(chalk.gray('  ```'));
}

/**
 * Print a key-value pair
 */
function keyValue(key, value, indent = 2) {
  console.log(' '.repeat(indent) + chalk.gray(`${key}: `) + chalk.white(value));
}

/**
 * Print a detection result
 */
function detected(type, name, detail = '') {
  const detailStr = detail ? chalk.gray(` (${detail})`) : '';
  console.log(chalk.green(`${symbols.success} ${type} detected: `) + chalk.bold.white(name) + detailStr);
}

/**
 * Print a project summary box
 */
function projectSummary(projects) {
  console.log('');
  console.log(chalk.bold.white('  Detected Projects:'));
  projects.forEach(p => {
    console.log(chalk.gray(`    ${symbols.bullet} `) + chalk.cyan(p.name) + chalk.gray(` (${p.type})`));
  });
}

/**
 * Print a final verdict
 */
function verdict(ready, message) {
  console.log('');
  if (ready) {
    console.log(chalk.bold.green(`${symbols.success} ${message}`));
  } else {
    console.log(chalk.bold.red(`${symbols.error} ${message}`));
  }
  console.log('');
}

/**
 * Print results as JSON
 */
function json(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Create a check result object
 */
function checkResult(status, message, detail = '', fixCmd = '') {
  return { status, message, detail, fixCmd };
}

module.exports = {
  symbols,
  success,
  error,
  warning,
  info,
  fix,
  command,
  header,
  subheader,
  divider,
  blank,
  listItem,
  code,
  keyValue,
  detected,
  projectSummary,
  verdict,
  json,
  checkResult
};
