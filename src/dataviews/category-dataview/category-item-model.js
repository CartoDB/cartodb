var Model = require('../../core/model');

/**
 * Model for a category
 */
module.exports = Model.extend({

  defaults: {
    name: '',
    agg: false,
    value: 0
  }

});
