var lockfile = require('yarn-lockfile');
var fs = require('fs');

function getDependencyName (str) {
  return str && str.split('@')[0];
}

function alldeps (mod, deps, name, parentVersion) {
  name = name ||mod.name;

  return Object.keys(mod.dependencies).reduce(function (all, dependency) {
    var dependencyName = getDependencyName(dependency);

    if (!all.hasOwnProperty(dependencyName)) {
      all[dependencyName] = {};
    }

    var version = mod.dependencies[dependency].version;
    var resolved = mod.dependencies[dependency].resolved;

    if (!all[dependencyName].hasOwnProperty(version)) {
      all[dependencyName][resolved] = {};
    }

    all[dependencyName][resolved] = version;

    return all;
  }, deps || {});
}

/**
 * Checks all modules dependencies versions within a yarn.lock to not be
 * duplicated from different parent dependencies.
 *
 * For instance if there are a couple of dependencies using a different version
 * of backbone it will return backbone with its parent dependencies.
 */
function duplicatedDependencies (yarnLock, modulesToValidate) {
  var file = fs.readFileSync(yarnLock, 'utf8');
  var json = lockfile.parse(file);

  var all = alldeps({
    dependencies: json,
    name: 'cartodb-ui',
    version: fs.readFileSync('./package.json', 'utf8').version
  });

  modulesToValidate = modulesToValidate || Object.keys(all);

  return modulesToValidate.reduce(function (duplicatedMods, mod) {
    var modVersions = Object.keys(all[mod]);
    
    if (modVersions.length > 1) {
      var invalidMod = { name: mod, versions: [] };

      modVersions.forEach(function (modVersion) {
        invalidMod.versions.push({version: modVersion, from: all[mod][modVersion]});
      });
      duplicatedMods.push(invalidMod);
    }
    return duplicatedMods;
  }, []);
}

module.exports = {
  checkDuplicatedDependencies: duplicatedDependencies
};
