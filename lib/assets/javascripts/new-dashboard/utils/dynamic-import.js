export function importFilesFrom (folderContext, patternNameRegex) {
  const stepsComponents = {};

  folderContext.keys().forEach(filename => {
    const name = stripTokenFromString(filename, patternNameRegex);
    const component = folderContext(filename);
    stepsComponents[name] = component.default;
  });

  return stepsComponents;
}

function stripTokenFromString (string, patternNameRegex) {
  const results = patternNameRegex.exec(string);
  return results[1];
}
