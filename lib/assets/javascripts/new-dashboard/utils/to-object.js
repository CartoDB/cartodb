const toObject = function toObject (array, property) {
  return array.reduce((finalObject, currentElement) => {
    finalObject[currentElement[property]] = currentElement;
    return finalObject;
  }, {});
};

export default toObject;
