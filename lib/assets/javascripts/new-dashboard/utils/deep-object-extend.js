// Copied from https://stackoverflow.com/questions/38345937/object-assign-vs-extend/42740894#42740894

function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export default function deepObjectExtend (target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepObjectExtend(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepObjectExtend(target, ...sources);
}
