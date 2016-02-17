var _ = require('underscore');
var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./add-widgets-formula-options-view');
var AddWidgetsSelectLayerView = require('./add-widgets-select-layer-view');

/**
 * View to select widget candidates to create.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._layerDefinitionModels = this._layerDefinitionsCollection.filter(_.property('tableModel'));
    this.model = new cdb.core.Model({
      layer_id: this._layerDefinitionModels[0].id
    });
    this.listenTo(this.model, 'change:layer_id', this.render);
  },

  render: function () {
    this.clearSubViews();
    this._renderSelectLayerView();

    // TODO should be wrapped in a tabpane component here
    var view = new AddWidgetsFormulaOptionsView({
      selectedLayer: this._selectedLayer()
    });
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  },

  _renderSelectLayerView: function () {
    var view = new AddWidgetsSelectLayerView({
      model: this.model,
      layerDefinitionModels: this._layerDefinitionModels
    });
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _selectedLayer: function () {
    var id = this.model.get('layer_id');
    return this._layerDefinitionsCollection.get(id);
  }

});
