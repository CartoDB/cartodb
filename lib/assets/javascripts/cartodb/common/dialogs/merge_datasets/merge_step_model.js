var $ = require('jquery');
var cdb = require('cartodb.js');
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

  reset: function() {
  },

  createView: function() {
    return new MergeStepView({
      model: this
    });
  },

  merge: function(callbacks) {
    // TODO: taken from old code, cdb.admin.MergeTableDialog.merge
    //   could this be done in a better way?
    $.ajax({
      type: 'POST',
      url: cdb.config.prefixUrl() + '/api/v1/imports',
      data: {
        table_name: this.get('tableName') + '_merge',
        sql: this.get('sql')
      },
      success: callbacks.success,
      error: callbacks.error
    });
  }

});
