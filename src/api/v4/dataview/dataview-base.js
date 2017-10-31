var _ = require('underscore');

function DataviewBase () {

}

DataviewBase.prototype._checkColumnInOptions = function (options) {
  if (!options || _.isUndefined(options.column) || _.isEmpty(options.column)) {
    throw new TypeError('Column property is mandatory when creating a dataview.');
  }
  if (!_.isString(options.column)) {
    throw new TypeError('Column property must be a string when creating a dataview.');
  }
};

module.exports = DataviewBase;
