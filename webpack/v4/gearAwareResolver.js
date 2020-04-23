const { resolve, join, sep } = require('path');
const fs = require('fs');

// Detect existing gears
const gearPaths = [
  join(__dirname, '../../gears'),
  join(__dirname, '../../private_gears')
]
  .filter(gearPath => fs.existsSync(gearPath))
  .reduce((gears, gearsDir) => {
    fs.readdirSync(gearsDir).forEach((gearName) => { gears[gearName] = resolve(gearsDir, gearName); });
    return gears;
  }, {})
;

const fileCache = {};
const gearResolved = new Set();
const ROOT_DIR = resolve(__dirname, '../../');

function rootDir (file, opts = {}) {
  if (fileCache[file] === undefined || opts.skipCache) {
    // Try to find the file in gears
    for (let [gearName, gearPath] of Object.entries(gearPaths)) {
      let fileGearPath = join(gearPath, file);
      let fileExistsAndBoundedToGear =
          fs.existsSync(fileGearPath) &&
          fs.lstatSync(fileGearPath).isFile() &&
          // Check that the file is not from outside the gear path
          // PE, using ../..
          resolve(fileGearPath).startsWith(gearPath)
      ;

      // Try to look for full folder overriding, preceded by @
      if (!fileExistsAndBoundedToGear) {
        let pathParts = file.split(sep);

        pathParts.some((pathPart, pathPartIdx) => {
          fileGearPath = pathParts.slice(0, pathPartIdx).join(sep);

          if (fileGearPath) fileGearPath += sep;

          fileGearPath +=
            '@' + pathPart + sep +
            pathParts.slice(pathPartIdx + 1).join(sep)
          ;

          fileGearPath = join(gearPath, fileGearPath);

          fileExistsAndBoundedToGear =
              fs.existsSync(fileGearPath) &&
              fs.lstatSync(fileGearPath).isDirectory() &&
              // Check that the file is not from outside the gear path
              // PE, using ../..
              resolve(fileGearPath).startsWith(gearPath)
          ;

          return fileExistsAndBoundedToGear;
        });
      }

      if (fileExistsAndBoundedToGear) {
        fileCache[file] = {
          path: fileGearPath,
          gear: gearName
        };
        gearResolved.add(fileCache[file].path);
        break;
      }
    }

    // Find the file in project path if not in gear
    if (fileCache[file] === undefined) {
      fileCache[file] = {
        path: resolve(ROOT_DIR, file),
        gear: null
      };
      gearResolved.add(fileCache[file].path);
    }
  }

  file = fileCache[file];

  if (!opts.includeGear) {
    file = file.path;
  }

  return file;
}

// See https://github.com/webpack/webpack/blob/8a7597aa6eb2eef66a8f9db3a0c49bcb96022a94/lib/NormalModuleReplacementPlugin.js
// See https://webpack.js.org/plugins/normal-module-replacement-plugin/
class GearResolverPlugin {
  _resolve (result, attrName) {
    if (!result) return;

    if (/^!/.test(result[attrName])) return result;

    let path = result[attrName].startsWith('/')
      ? result[attrName]
      : join(result.context, result[attrName])
    ;

    let relPath = result.context
      ? path.replace(new RegExp('^' + ROOT_DIR + '/?'), '')
      : result[attrName]
    ;

    if (gearResolved.has(relPath)) {
      return result;
    } else {
      const file = rootDir(relPath, { includeGear: true });

      if (file.gear !== null) { // The file has been overridden by a gear
        result[attrName] = file.path;
      }

      return result;
    }
  }

  apply (compiler) {
    compiler.hooks.normalModuleFactory.tap(
      'GearResolverPlugin',
      nmf => {
        nmf.hooks.afterResolve.tap('NormalModuleReplacementPlugin', result => {
          if (!result) return;
          return this._resolve(result, 'resource');
        });
      })
    ;
  }
}

module.exports = {
  rootDir: rootDir,
  GearResolverPlugin: GearResolverPlugin
};
