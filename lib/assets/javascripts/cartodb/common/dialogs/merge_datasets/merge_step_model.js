var cdb = require('cartodb.js-v3');
var MergeStepView = require('./merge_step_view');

/**
 * Last step in the merge flows, managed the actual merge flow
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    skipDefaultTemplate: true,
    user: undefined,
    tableName: '',
    sql: undefined
  },

  createView: function() {
    return new MergeStepView({
      model: this
    });
  }

});
