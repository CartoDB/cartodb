var fs = require('fs-extra');
var path = require('path');
var config = require('./fetchRequires.config.js');

function checkConfig () {
  if (!config.requirePattern) {
    throw new Error("requirePattern needed at fetchRequires.config.js - Use it to define the regular expression to use for finding require invocations. Example: require\\('(\\..+)'\\)");
  }
  if (!config.defaultExt) {
    throw new Error("defaultExt needed at fetchRequires.config.js - Use it to define the default extension to use for modules. Example: '.js'");
  }
  if (!config.validExtensions) {
    throw new Error("validExtensions needed at fetchRequires.config.js - Use it to laod modules as is. That's it, to define valid extensions that don't need appending the default extension. Example: ['.tpl', '.json']");
  }
}

var fetchRequires = function (absoluteFilePath) {
  checkConfig();
  var requirePattern = config.requirePattern;
  var requireGlobalRegex = new RegExp(requirePattern, 'g');
  var requireRegex = new RegExp(requirePattern);
  var defaultExt = config.defaultExt;
  var validExtensions = config.validExtensions;

  return new Promise(function (resolve, reject) {
    fs.readFile(absoluteFilePath, 'utf8', function (err, data) {
      if (err) {
        if (err.code && err.code === 'ENOENT') {
          var error = new Error("ENOENT: no such file '" + err.path + "'. Perhaps we're adding the default extension to a valid file. Check `validExtensions` in fetchRequires.config.js and add a new one if needed.");
          reject(error);
          return;
        }
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
