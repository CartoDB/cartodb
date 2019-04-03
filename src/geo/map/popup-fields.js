var _ = require('underscore');
var Backbone = require('backbone');

var getFieldNames = function (fields) {
  return _.map(fields, function (field) {
    var o = {};
    o[field.name] = field.title;
    return o;
  });
};

var PopupFields = Backbone.Collection.extend({
  equals: function (otherFields) {
    var myFields = this.toJSON();
    return _.isEqual(getFieldNames(myFields), getFieldNames(otherFields));
  }
});

module.exports = PopupFields;
