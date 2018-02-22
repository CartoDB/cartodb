const CoreView = require('backbone/core-view');
const _ = require('underscore');
var DatasetsItemView = require('./dataset-item-view');
var PlaceholderItem = require('./placeholder_item_view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

const MAP_CARDS_PER_ROW = 3;

/**
 *  View representing the list of items
 */

module.exports = CoreView.extend({

  tagName: 'ul',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    if (this.collection.options.get('page') === 1) {
      this.clearSubViews();
    }

    this.collection.each(this._addItem, this);

    let className = 'MapsList';

    if (this.collection._ITEMS_PER_PAGE * this.collection.options.get('page') >= this.collection.total_entries) {
      className += ' is-bottom';
    }

    this.$el.attr('class', className);

    if (this.collection.size() > 0) {
      this._fillEmptySlotsWithPlaceholderItems();
    }

    return this;
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  },

  _addItem: function (model) {
    const itemView = new DatasetsItemView({
      model,
      configModel: this._configModel
    });
    this.addView(itemView);
    this.$el.append(itemView.render().el);
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'reset', this.render);
  },

  _fillEmptySlotsWithPlaceholderItems: function () {
    _.times(this._emptySlotsCount(), function () {
      var view = new PlaceholderItem();
      this.$el.append(view.render().el);
      this.addView(view);
    }, this);
  },

  _emptySlotsCount: function () {
    return (this.collection._ITEMS_PER_PAGE - this.collection.size()) % MAP_CARDS_PER_ROW;
  }
});
