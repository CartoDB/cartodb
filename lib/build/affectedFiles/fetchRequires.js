var fs = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var fetchRequires = function (absoluteFilePath) {
  var requirePattern = "require\\('(\\..+)'\\)";
  var requireGlobalRegex = new RegExp(requirePattern, 'g');
  var requireRegex = new RegExp(requirePattern);
  var defaultExt = '.js';
  var validExtensions = ['.tpl', '.json', '.js'];

  return new Promise(function (resolve, reject) {
    fs.readFile(absoluteFilePath, 'utf8', function (err, data) {
      if (err) {
        reject(err);
        return;
      }

      var requires = [];
      if (data) {
        var matchData = data.match(requireGlobalRegex);
        if (matchData) {
          matchData.forEach(function (require) {
            var exec = requireRegex.exec(require);
            if (exec) {
              var absolutePath = path.resolve(path.dirname(absoluteFilePath), exec[1]);
              var ext = path.extname(absolutePath);
              if (validExtensions.indexOf(ext) === -1) {
                absolutePath += defaultExt;
              }
              requires.push(absolutePath);
            }
          });
        }
      }
      resolve(requires);
    });
  });
};

module.exports = fetchRequires;
