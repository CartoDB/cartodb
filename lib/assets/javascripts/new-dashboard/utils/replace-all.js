const replaceAll = function replaceAll (str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
};

export default replaceAll;
