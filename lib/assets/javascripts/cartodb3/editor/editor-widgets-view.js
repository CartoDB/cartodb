var cdb = require('cartodb-deep-insights.js');
var EditorWidgetView = require('./editor-widget-view');

/**
 * View to render widgets definitions overview
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this.listenTo(this.collection, 'add', this._addWidgetItem);
  },

  render: function () {
    this.clearSubViews();
    this.collection.each(this._addWidgetItem, this);
    return this;
  },

  _addWidgetItem: function (m) {
    var layerId = m.get('layer_id');
    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    var view = new EditorWidgetView({
      model: m,
      tableModel: layerDefinitionModel.getTableModel(),
      nextStackItem: this.options.nextStackItem
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
