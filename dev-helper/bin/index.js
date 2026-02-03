#!/usr/bin/env node

const { program } = require('commander');
const setup = require('../commands/setup');
const explain = require('../commands/explain');

program
  .name('dev-helper')
  .description('A beginner-friendly CLI tool that helps developers set up projects and understand errors')
  .version('2.1.0');

program
  .command('setup')
  .description('Detect project type, check environment, validate dependencies, and explain any issues found')
  .option('-v, --verbose', 'Show detailed output including all checks performed')
  .action((options) => setup(options));

program
  .command('explain')
  .description('Explain Git, runtime, build, or system errors in plain English with safe fixes')
  .option('-v, --verbose', 'Show additional context and debugging information')
  .action((options) => explain(options));

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log('');
  program.outputHelp();
  console.log('');
  console.log('Examples:');
  console.log('  $ dev-helper setup      Check if current project is ready to run');
  console.log('  $ dev-helper explain    Explain the most recent error you encountered');
  console.log('');
}
