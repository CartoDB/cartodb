var child = require('child_process');
var path = require('path');
var fs = require('fs');
var recursive = require('recursive-readdir');
var Promise = require('bluebird');
var _ = require('underscore');


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
};

var notNodeModules = function (file, stats) {
  return stats.isDirectory() && file.toLowerCase().indexOf('node_modules') > -1;
};

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

var getModifiedFiles = function (verbose) {
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

        if (verbose) {
          console.log(files);
        }
      })
  });

  return promise;  
};

module.exports = getModifiedFiles;
