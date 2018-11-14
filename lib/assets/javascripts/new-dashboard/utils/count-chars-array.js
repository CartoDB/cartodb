const countCharsArray = function countCharsArray (array, joinString = '') {
  if (!array || array.length === 0) {
    return 0;
  }
  if (!joinString) {
    joinString = '';
  }
  return array.join(joinString).length;
};

export default countCharsArray;
