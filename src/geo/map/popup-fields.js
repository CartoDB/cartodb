var _ = require('underscore');
var Backbone = require('backbone');

var getFieldNames = function (fields) {
  return _.map(fields, 'name');
};

var PopupFields = Backbone.Collection.extend({
  equals: function (otherFields) {
    var myFields = this.toJSON();
    return _.isEqual(getFieldNames(myFields), getFieldNames(otherFields));
  }
});

module.exports = PopupFields;
