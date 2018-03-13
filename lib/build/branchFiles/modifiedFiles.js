var child = require('child_process');
var path = require('path');
var fs = require('fs');
var recursive = require('recursive-readdir');
var _ = require('underscore');

/**
 * getCurrentBranchName
 * 
 * @returns {string} The name of the current git branch
 */
function getCurrentBranchName () {
  var promise = new Promise(function (resolve, reject) {
    child.exec('git rev-parse --abbrev-ref HEAD', function (error, stdout, stderr) {
      if (!error) {
        resolve(stdout.replace(/(\r\n|\n|\r)/gm, ''));
      }
    });
  });

  return promise;
}

/**
 * getFilesModifiedInBranch
 * 
 * @param {string} branchName The branch name to get the list of modified file list from.
 * @returns {Promise} result.
 * @resolves {string[]} The list of modified files in the given branch. 
 */
function getFilesModifiedInBranch (branchName) {
  var promise = new Promise(function (resolve, reject) {
    var files;
    var command = 'git diff --name-only ' + branchName + ' `git merge-base ' + branchName + ' master`';

    child.exec(command, function (error, stdout, stderr) {
      if (!error) {
        var newLine = /(\r\n|\n|\r)/;
        files = stdout.split(newLine).filter(function (file) {
          return file.trim().length > 0;
        });
        files = files.map(function (file) {
          return path.resolve('.', file);
        });
        resolve(files);
      }
    });
  });

  return promise;
}

var notNodeModules = function (file, stats) {
  return stats.isDirectory() && file.toLowerCase().indexOf('node_modules') > -1;
};

/**
 * getFilesInStatus
 * 
 * @returns {Promise} result.
 * @resolves {string[]} The list of working tree files as shown by `git status --short` but without status codes.
 */
function getFilesInStatus () {
  var promise = new Promise(function (resolve, reject) {
    child.exec('git status --short', function (error, stdout, stderr) {
      if (!error) {
        var newLine = /\n/;
        var files = stdout.split(newLine);
        var promises = files.reduce(function (acc, file) {
          if (file.trim().length > 0) {
            var name = file.slice(3);
            var resolvedPath = path.resolve('.', name);

            try {
              var stats = fs.statSync(resolvedPath);
              if (stats.isFile()) {
                acc.push(Promise.resolve(resolvedPath));
                return acc;
              } else if (stats.isDirectory()) {
                acc.push(new Promise(function (resolve, reject) {
                  recursive(resolvedPath, [notNodeModules], function (err, files) {
                    if (err) {
                      reject(err);
                    }

                    resolve(files);
                  });
                }));
                return acc;
              }
            } catch (err) {
              if (err.code === 'ENOENT') {
                acc.push(Promise.resolve(resolvedPath));
                return acc;
              } else {
                throw new Error(err);
              }
            }
          } else {
            return acc;
          }
        }, []);

        Promise.all(promises)
          .then(function (fileList) {
            resolve(_.uniq(_.compact(_.flatten(fileList))));
          });
      }
    });
  });
  return promise;
}

/**
 * getModifiedFiles
 * 
 * @returns {Promise} result.
 * @resolves {string[]} The list of all modified files of the working branch compared to master. It includes already committed files and the ones unstaged.
 */
var getModifiedFiles = function () {
  var files = [];

  var promise = new Promise(function (resolve, reject) {
    getCurrentBranchName()
      .then(function (branchName) {
        return getFilesModifiedInBranch(branchName);
      })
      .then(function (modifiedFiles) {
        files = files.concat(modifiedFiles);
        return getFilesInStatus();
      })
      .then(function (filesInStatus) {
        files = _.uniq(files.concat(filesInStatus));
        resolve(files);
      });
  });

  return promise;
};

module.exports = getModifiedFiles;
