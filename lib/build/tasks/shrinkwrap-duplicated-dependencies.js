function alldeps (mod, deps, name, parentVersion) {
  name = name || mod.name;
  return Object.keys(mod.dependencies).reduce(function (all, dependency) {
    if (!all.hasOwnProperty(dependency)) {
      all[dependency] = {};
    }

    var version = mod.dependencies[dependency].version;
    var resolved = mod.dependencies[dependency].resolved;
    if (!all[dependency].hasOwnProperty(version)) {
      all[dependency][resolved] = {};
    }

    all[dependency][resolved][name] = parentVersion || version;
    if (mod.dependencies[dependency].dependencies) {
      alldeps(mod.dependencies[dependency], all, dependency, version);
    }
    return all;
  }, deps || {});
}

/**
 * Checks all modules dependencies versions within a npm-shrinkwrap to not be
 * duplicated from different parent dependencies.
 *
 * For instance if there are a couple of dependencies using a different version
 * of backbone it will return backbone with its parent dependencies.
 */
function duplicated (shrinkwrap, modulesToValidate) {
  shrinkwrap = shrinkwrap || require('./npm-shrinkwrap.json');
  var all = alldeps(shrinkwrap);

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

module.exports = duplicated;
