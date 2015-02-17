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
    this.createModel.bind('mapError', this._onMapError, this);
    this.createModel.bind('mapCreating', this._onMapLoading, this);
    this.createModel.bind('datasetError', this._onDatasetError, this);
    this.createModel.bind('datasetCreating', this._datasetCreating, this);
    this.add_related_model(this.createModel);
  },

  _datasetCreating: function() {
    this.model.set({
      type: 'dataset',
      state: 'loading'
    });
  },

  _onDatasetError: function() {
    this.model.set({
      type: 'dataset',
      state: 'error'
    });
  },

  _onMapError: function() {
    this.model.set({
      type: 'map',
      state: 'error'
    });
  },

  _onMapLoading: function() {
    this.model.set({
      type: 'map',
      state: 'loading'
    });
  }

});