var CoreView = require('backbone/core-view');
var CustomListView = require('../custom-list/custom-list-view');
var CustomListItemView = require('../custom-list/custom-list-item-view');
var CustomListItemTemplate = require('./custom-list-item.tpl');
var _ = require('underscore');

var REQUIRED_OPTS = [

];

module.exports = CoreView.extend({
  className: 'Editor-boxModal Editor-PrivacyDialog',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();
    this._renderList();
    return this;
  },

  _renderList: function () {
    var listView = new CustomListView({
      model: this.model,
      collection: this.collection,
      ItemView: CustomListItemView,
      itemTemplate: CustomListItemTemplate
    });
    this.$el.append(listView.render().el);
    this.addView(listView);
  }
});
