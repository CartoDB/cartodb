function serialize (dataviewsCollection) {
  return dataviewsCollection.reduce(function (dataviews, dataviewModel) {
    dataviews[dataviewModel.get('id')] = dataviewModel.toJSON();
    return dataviews;
  }, {});
}

module.exports = {
  serialize: serialize
};
