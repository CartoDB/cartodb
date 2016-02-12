var cdb = require('cartodb-deep-insights.js');
var EditorWidgetView = require('./editor-widget-view');

/**
 * View to render widgets definitions overview
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this.listenTo(this._widgetDefinitionsCollection, 'add', this._renderWidget);
  },

  render: function () {
    this._renderCollection();
    return this;
  },

  _renderCollection: function () {
    this._widgetDefinitionsCollection.each(this._renderWidget, this);
  },

  _renderWidget: function (m) {
    var layerId = m.get('layer_id');
    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    var tableModel = layerDefinitionModel.getTableModel();
    var view = new EditorWidgetView({
      model: m,
      tableModel: tableModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
