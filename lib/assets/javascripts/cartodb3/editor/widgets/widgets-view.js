var cdb = require('cartodb-deep-insights.js');
var EditorWidgetView = require('./widget-view');

/**
 * View to render widgets definitions overview
 */
module.exports = cdb.core.View.extend({

  className: 'BlockList',

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this.stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this._widgetDefinitionsCollection, 'add', this._addWidgetItem);
  },

  render: function () {
    this.clearSubViews();
    this._widgetDefinitionsCollection.each(this._addWidgetItem, this);
    return this;
  },

  _addWidgetItem: function (m) {
    var view = new EditorWidgetView({
      model: m,
      layer: this._layerDefinitionsCollection.get(m.get('layer_id')),
      stackLayoutModel: this.stackLayoutModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
