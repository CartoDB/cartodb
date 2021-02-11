export function matchString (search, data, callback) {
  const regex = new RegExp(normalize(search.toLowerCase()), 'gi');

  if (!Array.isArray(data)) {
    return normalize(data).match(regex);
  }

  return data.filter(match => {
    const newData = callback ? callback(match) : match;
    return normalize(newData).match(regex);
  });
}

export function normalize (data) {
  return data.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
