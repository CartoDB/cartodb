var cdb = require('cartodb-deep-insights.js');
var template = require('./layer.tpl');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item',

  events: {
    'click .js-remove': '_onRemove'
  },

  initialize: function (opts) {
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;

    this.$el.html(template({
      title: m.getName(),
      letter: m.get('letter')
    }));

    this._renderAnalysisView();

    return this;
  },

  _renderAnalysisView: function () {
    var source = this.model.get('source');
    if (source) {
      var analysisView = this._layerAnalysisViewFactory.createView(source, this.model);
      this.$('.js-analysis').append(analysisView.render().$el);
    }
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
