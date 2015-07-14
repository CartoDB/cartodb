var Backbone = require('backbone');
var _ = require('underscore');

/**
 *  Pecan model
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    table_id: '',
    column_name: '',
    state: 'idle'
  },

  initialize: function() {
    this.sql = cdb.admin.SQL();
  },

  getData: function() {
    var self = this;
    this.sql.execute('SELECT * FROM ' + this.get('table_id')).done(function(r) {
      console.log(r);
      self.set('state', 'analyzed')
    });
  },

  isAnalyzed: function() {
    return this.get('state') === 'analyzed';
  },

  hasFailed: function() {
    return this.get('state') ===  'failed';
  }

});