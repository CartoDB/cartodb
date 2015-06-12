var cdb = require('cartodb.js');

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

    // we could use table.addColumn method
    // but we need to have more info when
    // request fails
    var c = new cdb.admin.Column({
      table: this.table,
      _name: new Date().getTime(),
      type: 'string'
    }).save(null, {
      success: function(r) {
        self.trigger('newColumn', r, this);
        self.model.set('state', 'idle');
      },
      error: function(e, resp) {
        self.model.set('state', 'error');
      }
    });
  }

});
