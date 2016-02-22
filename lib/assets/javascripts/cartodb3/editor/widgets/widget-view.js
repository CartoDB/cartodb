var cdb = require('cartodb-deep-insights.js');
var template = require('./widget.tpl');

/**
 * View for an individual widget definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .js-remove': '_onRemove',
    'click': '_onEdit'
  },

  initialize: function (opts) {
    this.stackLayoutModel = opts.stackLayoutModel;
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.$el.html(template({
      title: this.model.get('title')
    }));
    return this;
  },

  _onEdit: function () {
    this.stackLayoutModel.nextStep(this.model);
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
