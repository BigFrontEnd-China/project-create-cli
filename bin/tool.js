/*
 *@Description:
 *@Author: Jackson
 *@Date: 2021-08-10 10:35:19
 *@UpdateDate:
 */
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const exec = require('child_process').exec;
const fse = require('fs-extra');
/**
 *
 * @param {分支} branch
 * @param {路径} url
 * @param {选择结果} answers
 * @returns
 */
function createProject(branch, url, answers) {
  const projectName = answers.projectName;
  const gitCmd = `git clone --branch ${branch} ${url} ${projectName}`;

  return new Promise((resolve, reject) => {
    exec(gitCmd, (err, stdout, stderr) => {
      if (err) {
        console.log('stderr: ', stderr);
        reject(err);
      } else {
        shell.rm('-rf', process.cwd() + `/${projectName}/.git`);
        resolve(answers);
      }
    });
  });
}

function updatePackageJson(answers) {
  return new Promise((resolve, reject) => {
    const projectName = answers.projectName;
    const packagejsonPath = path.resolve(process.cwd(), `${projectName}/package.json`);
    const packageJson = Object.assign(require(packagejsonPath), {
      name: projectName,
      author: answers.author,
      version: '1.0.0',
      description: answers.description || projectName
    });
    fs.writeFileSync(packagejsonPath, JSON.stringify(packageJson, null, 4));
    resolve(projectName);
  }).catch((error) => {
    return error;
  });
}

function deleteDir(dir) {
  return new Promise((resolve, reject) => {
    fse
      .remove(dir)
      .then(() => {
        resolve(dir);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function npmInstall(dir, npmInstall) {
  return new Promise((resolve, reject) => {
    let installCommand = '';
    switch (npmInstall) {
      case 'npm':
        installCommand = `cd ${dir} && npm i --registry=https://registry.npm.taobao.org`;
        break;
      case 'pnpm':
        installCommand = `cd ${dir} && pnpm i --registry=https://registry.npm.taobao.org`;
        break;
      default:
        installCommand = `cd ${dir} && npm i --registry=https://registry.npm.taobao.org`;
        break;
    }
    exec(installCommand, (err, stdout, stderr) => {
      if (err) {
        console.log('stderr: ', stderr);
        reject(err);
      } else {
        resolve(dir);
      }
    });
  });
}

module.exports = {
  createProject,
  updatePackageJson,
  deleteDir,
  npmInstall
};
