var cdb = require('cartodb.js');
var WidgetListItemView = require('./item-view');

/**
 * View to render a set of list items
 * this.model is a widget Model
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-list js-list',
  tagName: 'ul',

  events: {
    'scroll': '_checkScroll'
  },

  initialize: function (opts) {
    this._dataviewModel = opts.dataviewModel;
  },

  render: function () {
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function () {
    this._dataviewModel.getData().each(this._addItem, this);
  },

  _addItem: function (mdl) {
    var v = new WidgetListItemView({
      model: mdl,
      widgetModel: this.model,
      dataviewModel: this._dataviewModel
    });
    v.bind('itemClicked', function () {
      this.trigger('itemClicked', mdl, this);
    }, this);
    this.addView(v);
    this.$el.append(v.render().el);
  }

});
