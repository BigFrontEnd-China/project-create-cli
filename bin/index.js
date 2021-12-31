#!/usr/bin/env node
/**
 * index.js
 * @file 入口文件
 * @author Jackson
 */

const inquirer = require('inquirer');
const program = require('commander');
const version = require('../package.json').version;
const gitPath = require('../package.json').gitPath;
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const spinner = ora();
const validateProjectName = require('validate-npm-package-name');
const { createProject, updatePackageJson, deleteDir, npmInstall } = require('./tool');

const logo = ` `;
let userQuestions = [
  {
    type: 'input',
    name: 'description',
    message: 'Please Enter Project Description',
    default() {
      return 'A vue project';
    }
  },
  {
    type: 'input',
    name: 'author',
    message: 'Please Enter Author',
    default() {
      return 'Your Name <you@example.com>';
    }
  }
];

program
  .version(version, '-v, --version')
  .description('CLI for rapid EOP swan development')
  .usage('<command> [options]');

// 初始化命令
program.command('create <project>').action((projectName) => {
  if (projectName) {
    console.log(chalk.cyan(logo));
    const cwd = process.cwd();
    const inCurrent = projectName === '.';
    const name = inCurrent ? path.relative('../', cwd) : projectName;
    const targetDir = path.resolve(cwd, projectName || '.');
    const result = validateProjectName(name);
    if (!result.validForNewPackages) {
      console.error(chalk.red(`Invalid Project Name: "${name}"`));
      result.errors &&
        result.errors.forEach((err) => {
          console.error(chalk.red.dim('Error: ' + err));
        });
      result.warnings &&
        result.warnings.forEach((warn) => {
          console.error(chalk.red.dim('Warning: ' + warn));
        });
      process.exit();
    }
    if (fs.existsSync(targetDir)) {
      if (inCurrent) {
        const { ok } = inquirer.prompt([
          {
            name: 'ok',
            type: 'confirm',
            message: `Generate project in current directory?`
          }
        ]);
        if (!ok) {
          return;
        }
      } else {
        inquirer
          .prompt([
            {
              name: 'action',
              type: 'list',
              message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
              choices: [
                { name: 'Remove', value: 'Remove' },
                { name: 'Cancel', value: false }
              ]
            }
          ])
          .then((choiceData) => {
            if (choiceData.action === 'Remove') {
              //console.log(`Removing... ${chalk.cyan(targetDir)}`)
              spinner.start(`${chalk.red('Removing...')}`);
              return deleteDir(targetDir);
            } else {
              return;
            }
          })
          .then(() => {
            spinner.succeed(chalk.green('Remove filished！'));
            startCreate(name);
          });
      }
    } else {
      startCreate(name);
    }
  } else {
    return 'ProjectName Is Null！';
  }
});
async function startCreate(projectName) {
  let gitUrl = '';
  let branch = '';
  await inquirer
    .prompt([
      {
        name: 'action',
        type: 'list',
        message: `Please Select Project template:`,
        choices: gitPath
      }
    ])
    .then((data) => {
      gitUrl = data.action.url;
      branch = data.action.branch;
      installType = data.action.installType;
    });
  await inquirer
    .prompt(userQuestions)
    .then((answers) => {
      if (answers && gitUrl && branch) {
        spinner.start(`Create Project...`);
        return createProject(branch, gitUrl, { ...answers, projectName });
      } else {
        console.log('Please Use Cestc Create Commander！');
      }
    })
    .then((answers) => {
      spinner.succeed(chalk.green('Create Project Filished！'));
      return updatePackageJson(answers);
    })
    .then((dir) => {
      spinner.succeed(chalk.green('Update package.json Filished！'));
      spinner.start(`${installType} Initializing Dependencies...`);
      return npmInstall(dir, installType);
    })
    .then((dir) => {
      spinner.succeed(chalk.green('Project Initializing Dependencies Finished!'));
      let runCommand = installType === 'pnpm' ? 'pnpm' : 'npm';
      console.log(`cd ${dir} && ${runCommand} run dev`);
      spinner.stop();
      process.exit();
    })
    .catch((err) => {
      spinner.fail(chalk.red(err.toString()));
      console.log(err);
    });
}

program.parse(process.argv);
