var fs = require('fs-extra');
var path = require('path');
var colors = require('colors');
var recursive = require('recursive-readdir');
var minimist = require('minimist');
var Promise = require('bluebird');
var _ = require('underscore');
var FileTrie = require('./fileTrie');

var configFile = './tree.config.json';
var start = Date.now();
var trie = new FileTrie();
var config;


var replaceSpec = function (spec) {
  return replacements.reduce(function (acc, replacement) {
    return acc.replace(replacement[0], replacement[1]);
  }, spec);
};

var main = function (testsFolder, replacements, modifiedFiles, filesRegex) {
  filesRegex = filesRegex || 'spec\\.js$';

  var onlyTheseFiles = function (file, stats) {
    var theRegex = new RegExp(filesRegex);
    return !stats.isDirectory() && !theRegex.test(file);
  };

  recursive(testsFolder, [onlyTheseFiles], function (err, files) {
    if (!files || files.length === 0) {
      console.log('Spec files not found.');
      return -1;
    }

    console.log('Found ' + files.length + ' spec files.');
    var allFilePromises = files.reduce(function (acc, file) {
      acc.push(trie.addFileRequires(file));
      return acc;
    }, []);
    Promise.all(allFilePromises)
      .then(function () {
        console.log('Dependency tree created.');
        console.log(colors.magenta('Took ' + (Date.now() - start)));

        console.log('Getting reverse spec dependencies...');
        
        var markStart = Date.now();
        files.forEach(function (file) {
          trie.markSubTree(file);
        });
        console.log(colors.magenta('Took ' + (Date.now() - markStart)));

        var affectedSpecs = _.chain(modifiedFiles)
          .reduce(function (acc, modifiedFile) {
            var node = trie.getNode(modifiedFile);

            if (node && node.marks && node.marks.length > 0) {
              acc = acc.concat(node.marks);
              return acc;
            }
            return acc;
          }, [])
          .uniq()
          .value();

        var targetSpecs = affectedSpecs.map(function (spec) {
          return replaceSpec(spec);
        });

        console.log('<affected>');
        targetSpecs.forEach(function (spec) {
          console.log(spec);
        });
        console.log('</affected>');
      })
      .catch(function (reason) {
        console.error(colors.red(reason));
      });
  });
};

// Read configuration
try {
  if (fs.statSync(configFile)) {
    config = fs.readJsonSync(configFile);
    if (!config.testsFolder) {
      console.error('`testsFolder` not found in config file.');
      return -1;
    }
    if (!config.replacements) {
      console.error('`replacements` not found in config file.');
      return -1;
    }
    testsFolder = config.testsFolder;
    replacements = config.replacements;
    var modifiedFiles = minimist(process.argv.slice(2))._;
    main(config.testsFolder, config.replacements, modifiedFiles, config.filesRegex);
  }
} catch (err) {
  if (err.code && err.code === 'ENOENT') {
    console.error('Config file `tree.config.json` not found!');
    return -1;
  }
}
