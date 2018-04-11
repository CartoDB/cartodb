var path = require('path');
var colors = require('colors');

var fetchRequires = require('./fetchRequires');
var cleanArray = require('./cleanArray');

var FileTrie = function () {
  var trie = {
    root: {}
  };

  var addFileRequires = function (filePath) {
    var promise = new Promise(function (resolve, reject) {
      if (!path.extname(filePath)) {
        reject('filePath must contain a valid file path.');
        return;
      }

      var key = _buildKey(filePath, true);
      var fileName = path.basename(filePath);
      var lastNode = _writeKey(key);
      if (!lastNode[fileName]) {
        fetchRequires(filePath)
          .then(function (requires) {
            lastNode[fileName] = {};
            if (requires.length > 0) {
              lastNode[fileName].requires = requires;
              lastNode[fileName].fetched = false;
              var allRequirePromises = requires.reduce(function (acc, require) {
                acc.push(addFileRequires(require));
                return acc;
              }, []);
              Promise.all(allRequirePromises)
                .then(function () {
                  lastNode[fileName].fetched = true;
                  resolve();
                })
                .catch(function (reason) {
                  reject(reason);
                });
            } else {
              lastNode[fileName].requires = [];
              lastNode[fileName].fetched = true;
              resolve();
            }
          })
          .catch(function (reason) {
            reject(reason);
          });
      } else {
        resolve();
      }
    });
    return promise;
  };

  var markSubTree = function (entryFilePath, mark) {
    var filesToMark;
    var fileToMark;
    var node;

    mark = mark || entryFilePath;
    filesToMark = [entryFilePath];
    while (filesToMark.length > 0) {
      fileToMark = filesToMark.pop();
      node = getNode(fileToMark);
      if (!node.marks) {
        node.marks = [];
      }
      if (node.marks.indexOf(mark) === -1) {
        node.marks.push(mark);
        if (node.requires && node.requires.length > 0) {
          filesToMark = filesToMark.concat(node.requires);
        }
      }
    }
  };

  var getNode = function (filePath) {
    var key = _buildKey(filePath);
    var node = trie.root;
    var validKey = true;
    for (var i = 0; i < key.length && validKey; i++) {
      if (!node[key[i]]) {
        validKey = false;
      } else {
        node = node[key[i]];
      }
    }

    if (!validKey) {
      return null;
    }
    return node;
  };

  var _buildKey = function (filePath, onlyDir) {
    var key = filePath;
    if (onlyDir) {
      key = path.dirname(filePath);
    }
    return cleanArray(key.split(path.sep));
  };

  var _writeKey = function (key) {
    var node = trie.root;
    var subKey;

    for (var i = 0; i < key.length; i++) {
      subKey = key[i];
      if (!node[subKey]) {
        node[subKey] = {};
      }
      node = node[subKey];
    }
    return node;
  };

  var print = function () {
    console.log(colors.yellow(JSON.stringify(trie)));
  };

  return {
    addFileRequires: addFileRequires,
    getNode: getNode,
    markSubTree: markSubTree,
    print: print
  };
};

module.exports = FileTrie;
