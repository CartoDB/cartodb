var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Model that represents the widget form schema definition
 */
module.exports = cdb.core.Model.extend({
  toJSON: function () {
    return {
      type: this.get('type'),
      options: _.omit(this.attributes, ['type', 'layer_id'])
    };
  }
});
