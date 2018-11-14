const countCharsArray = function countCharsArray (array, charsBetweenElements = 0) {
  if (!array || array.length === 0) {
    return 0;
  }
  const charsInTag = array.map(elem => elem.length).reduce((a, b) => a + b, 0);
  const extraSpaceChars = (array.length - 1) * charsBetweenElements;
  return charsInTag + extraSpaceChars;
};

export default countCharsArray;
