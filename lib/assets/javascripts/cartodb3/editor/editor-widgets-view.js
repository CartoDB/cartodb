var cdb = require('cartodb-deep-insights.js');
var EditorWidgetView = require('./editor-widget-view');

/**
 * View to render widgets definitions overview
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function () {
    this.listenTo(this.collection, 'add', this._addWidgetItem);
  },

  render: function () {
    this.clearSubViews();
    this.collection.each(this._addWidgetItem, this);
    return this;
  },

  _addWidgetItem: function (m) {
    var view = new EditorWidgetView({
      model: m
    });
    view.bind('onClick', function (mdl) {
      this.options.nextStackItem && this.options.nextStackItem(mdl);
    }, this);
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
