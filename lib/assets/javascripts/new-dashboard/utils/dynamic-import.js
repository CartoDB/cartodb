export function importFilesFrom (folderContext, patternNameRegex) {
  const components = {};

  folderContext.keys().forEach(filename => {
    const name = stripTokenFromString(filename, patternNameRegex);
    const component = folderContext(filename);
    components[name] = component.default;
  });

  return components;
}

function stripTokenFromString (string, patternNameRegex) {
  const results = patternNameRegex.exec(string);
  return results[1];
}
