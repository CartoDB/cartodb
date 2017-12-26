//
// As we want to keep dependencies in sync with cartodb.js so we don't end having different shared dependencies.
//
// We check dependencies present in deep-insights.js are exactly the same when they are found in cartodb.js. For
// instance we want to have same backbone version in both projects.
//
// If we upgrade backbone in cartodb.js this will make grunt to fail until backbone is upgraded in this module.
//

var fs = require('fs');

module.exports = function(grunt) {
  return function() {
    var done = this.async();
    verifyDependencies(grunt.log, function(err) {
      if (err) {
        grunt.fail.warn(err);
      }
      done();
    });
  }
};

function verifyDependencies(logger, callback) {
  filesParsed(['package.json', 'node_modules/cartodb.js/package.json'], function (err, results) {
    if (err) {
      return callback(err);
    }
    var deepInsightsPkg = results[0];
    var cartodbPkg = results[1];

    var dependencyError = null;
    if (!hasExactDependencies(deepInsightsPkg, cartodbPkg, logger)) {
      dependencyError = new Error('Dependencies shared between deep-insights.js and cartodb.js should use same version.');
    }

    return callback(dependencyError);
  });
}

function hasExactDependencies(originPackage, destPackage, logger) {
  var exactDependencies = true;

  var destPackageDependencies = destPackage.dependencies;
  Object.keys(originPackage.dependencies).forEach(function(dependency) {
    if (destPackageDependencies[dependency]) {

      var destDependencyVersion = destPackageDependencies[dependency];
      var originDependencyVersion = originPackage.dependencies[dependency];

      var dependenciesLog = '"' + dependency + '" uses' +
        ' version "' + destDependencyVersion+ '" in cartodb.js and' +
        ' version "' + originDependencyVersion + '" in deep-insights.js.';
      logger.debug(dependenciesLog);
      
      if (destDependencyVersion !== originDependencyVersion) {
        logger.warn('Problem with dependency ' + dependenciesLog);
        exactDependencies = false;
      }
    }
  });

  return exactDependencies;
}

function filesParsed(pkgFilesPaths, callback) {
  var numberOfTasks = pkgFilesPaths.length;
  var results = [];
  function done(index, result) {
    results[index] = result;
    if (--numberOfTasks === 0) {
      return callback(null, results)
    }
  }

  pkgFilesPaths.forEach(function(pkgFilesPath, pkgFileIndex) {
    fs.readFile(pkgFilesPath, function (err, pkg) {
      if (err) {
        return callback(new Error('Could not read "' + pkgFilesPath + '" for validation.'));
      }
      var parsedPkg;
      try {
        parsedPkg = JSON.parse(pkg);
      } catch (e) {
        return callback(new Error('Could not parse "' + pkgFilesPath + '" for validation.'));
      }
      return done(pkgFileIndex, parsedPkg);
    });
  });
}
