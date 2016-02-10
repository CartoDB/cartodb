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
    this.listenTo(this.collection, 'add', this._onAddWidgetDefinition);
  },

  render: function () {
    return this;
  },

  _onAddWidgetDefinition: function (m) {
    var view = new EditorWidgetView({
      model: m,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
