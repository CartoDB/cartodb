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
 * Checks all modules dependencies versions within a package-lock to not be
 * duplicated from different parent dependencies.
 *
 * For instance if there are a couple of dependencies using a different version
 * of backbone it will return backbone with its parent dependencies.
 */
function duplicatedDependencies (lockFileContent, modulesToValidate) {
  var all = alldeps(lockFileContent);

  modulesToValidate = modulesToValidate || Object.keys(all);

  return modulesToValidate.reduce(function (duplicatedMods, mod) {
    if (all[mod] === undefined) {
      console.error('!!! ERROR !!!');
      console.error('Trying to get all dependencies from ', mod, ' but it does not exist.');
      console.error('!!! ERROR !!!');
    }
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

/**
 * Checks if the version of a package-lock file matches with the version of another lock file.
 * It is necessary to pass the modules to validate.
 *
 * It will return the modules where the version differs.
 */
function dependenciesVersion (lockFileContentOne, lockFileContentTwo, modulesToValidate) {
  var allDependenciesOne = alldeps(lockFileContentOne);
  var allDependenciesTwo = alldeps(lockFileContentTwo);

  return modulesToValidate.reduce(function (depWithDiffVer, mod) {
    var verDepFromOne = Object.keys(allDependenciesOne[mod])[0];
    var verDepFromTwo = Object.keys(allDependenciesTwo[mod])[0];

    if (verDepFromOne !== verDepFromTwo) {
      depWithDiffVer.push(mod);
    }

    return depWithDiffVer;
  }, []);
}

module.exports = {
  checkDuplicatedDependencies: duplicatedDependencies,
  checkDependenciesVersion: dependenciesVersion
};
