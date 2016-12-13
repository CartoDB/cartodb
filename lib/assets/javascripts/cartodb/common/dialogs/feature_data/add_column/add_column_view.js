var cdb = require('cartodb.js-v3');

/**
 *  Add column view
 *
 */

module.exports = cdb.core.View.extend({

  className: 'AddColumn js-addField',

  events: {
    'click .js-addColumn': '_addColumn'  
  },

  initialize: function() {
    this.model = new cdb.core.Model({
      state: 'idle'
    });
    this.table = this.options.table;
    this.template = cdb.templates.getTemplate('common/dialogs/feature_data/add_column/add_column');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        state: this.model.get('state')
      })
    )
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
  },

  _addColumn: function() {
    var self = this;
    // Loading
    this.model.set('state', 'loading');

    this.table.addColumn('column_' + new Date().getTime(), 'string', {
      success: function(mdl, data) {
        self.trigger('newColumn', mdl, this);
        self.model.set('state', 'idle');
      },
      error: function() {
        self.model.set('state', 'error');
      }
    });
  }

});
