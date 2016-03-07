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
    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    var m = this.model;
    this.$el.html(template({
      title: m.getName(),
      letter: m.get('letter')
    }));
    return this;
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
