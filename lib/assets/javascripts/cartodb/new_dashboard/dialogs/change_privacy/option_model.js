var cdb = require('cartodb.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({
  
  classNames: function() {
    return _.chain(['disabled', 'selected'])
      .map(function(attr) { return !!this.attributes[attr] ? 'is-'+attr : undefined; }, this)
      .compact().value().join(' ');
  }
});
