/**
 * branchFiles
 * 
 * Outputs the list of modified files in the current branch compared to master.
 * Includes already commited files and the ones unstaged. 
 */

var _ = require('underscore');
var colors = require('colors');
var modifiedFiles = require('./modifiedFiles');

var fileList = [];

var getModifiedFiles = function () {
  modifiedFiles()
    .then(function (files) {
      var newFiles = _.difference(files, fileList);
      var removedFiles = _.difference(fileList, files);
      var change = false;
      fileList = files;

      if (newFiles.length > 0) {
        change = true;
      }
      if (removedFiles.length > 0) {
        change = true;
      }

      if (change) {
        fileList.forEach(function file (file) {
          console.log(file);
        });
      }
    })
    .catch(function (reason) {
      console.log(colors.red(reason));
    });
};

getModifiedFiles();
