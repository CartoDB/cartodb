var _ = require('underscore');

/**
 *
 * Represent a dataview base object.
 *
 */
function DataviewBase () {

}

DataviewBase.prototype.getData = function () {
  var model = this.$getInternalModel();
  if (model) {
    return model.getData();
  }
};

DataviewBase.prototype._checkColumnInOptions = function (options) {
  if (!options || _.isUndefined(options.column) || _.isEmpty(options.column)) {
    throw new TypeError('Column property is mandatory when creating a dataview.');
  }
  if (!_.isString(options.column)) {
    throw new TypeError('Column property must be a string when creating a dataview.');
  }
};

DataviewBase.prototype.$setEngine = function (engine) {
  throw new Error('$setEngine must be implemented by the particular dataview.');
};

DataviewBase.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = DataviewBase;
