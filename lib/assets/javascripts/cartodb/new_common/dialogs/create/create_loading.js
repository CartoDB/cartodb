var cdb = require('cartodb.js');

/**
 *  Create loading view
 *
 *  It will show a big loading when a new map is gonna be created
 *
 */

module.exports = cdb.core.View.extend({

  className: 'IntermediateInfo',
  tagName: 'div',
  
  initialize: function() {
    this.createModel = this.options.createModel;
    this.model = new cdb.core.Model({ state: 'idle', type: 'dataset' });
    this.template = cdb.templates.getTemplate('new_common/views/create/create_loading');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template({
        type: this.model.get('type'),
        state: this.model.get('state')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
    this.createModel.bind('datasetError mapError', this._itemError, this);
    this.createModel.bind('datasetCreating mapCreating', this._itemCreating, this);
    this.add_related_model(this.createModel);
  },

  _itemCreating: function(type, m, v) {
    this.model.set({
      type: type,
      state: 'loading'
    });
  },

  _itemError: function(m, v) {
    this.model.set({
      state: 'error'
    });
  }

});