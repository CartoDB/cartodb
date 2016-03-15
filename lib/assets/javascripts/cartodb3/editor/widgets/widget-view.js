var cdb = require('cartodb-deep-insights.js');
var template = require('./widget-view.tpl');

/**
 * View for an individual widget definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item',

  events: {
    'click .js-remove': '_onRemove',
    'click': '_onEdit'
  },

  initialize: function (opts) {
    if (!opts.layer) throw new Error('layer is required');
    this.layer = opts.layer;
    this.stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.$el.html(template({
      layerName: this.layer.getName(),
      title: this.model.get('title')
    }));
    return this;
  },

  _onEdit: function () {
    this.stackLayoutModel.nextStep(this.model, 'widgets');
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
