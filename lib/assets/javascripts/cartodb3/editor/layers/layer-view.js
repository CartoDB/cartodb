var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var template = require('./layer.tpl');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item',

  events: {
    'click .js-remove': '_onRemove',
    'click .js-title': '_onEdit'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!_.isFunction(opts.newAnalysisViews)) throw new Error('newAnalysisViews is required as a function');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._newAnalysisViews = opts.newAnalysisViews;

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

    if (m.get('source')) {
      var view = this._newAnalysisViews(this.$('.js-analyses'), m);
      this.addView(view);
      view.render();
    }

    return this;
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onEdit: function () {
    this._stackLayoutModel.nextStep(this.model, 'layers');
  },

  _onDestroy: function () {
    this.clean();
  }
});
