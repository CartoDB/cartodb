var areAllDataviewsFetched = function (dataviewsCollection) {
  return dataviewsCollection.length > 0 && dataviewsCollection.all(function (dataviewModel) {
    return dataviewModel.isUnavailable() || dataviewModel.isFetched();
  });
};

// dataviewsCollection is indded a Backbone Collection
var whenAllDataviewsFetched = function (dataviewsCollection, callback) {
  var check = function () {
    areAllDataviewsFetched(dataviewsCollection) && callback();
  };

  dataviewsCollection.on('change:status', check);
  check();
};

module.exports = whenAllDataviewsFetched;
