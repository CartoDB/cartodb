export function cloneObject (objectToClone) {
  return JSON.parse(JSON.stringify(objectToClone));
}
