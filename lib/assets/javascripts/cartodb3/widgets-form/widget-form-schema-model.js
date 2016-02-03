var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Model that represents the widget form schema definition
 */
module.exports = cdb.core.Model.extend({
  toJSON: function () {
    return {
      type: this.get('type'),
      title: this.get('title'),
      options: _.omit(this.attributes, ['type', 'layer_id', 'title'])
    };
  }
});
