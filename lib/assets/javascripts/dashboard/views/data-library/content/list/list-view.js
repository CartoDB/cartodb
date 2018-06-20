const CoreView = require('backbone/core-view');
const _ = require('underscore');
const DatasetsItemView = require('./dataset-item-view');
const PlaceholderItem = require('./placeholder-item-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'collection'
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
    if (this._collection.options.get('page') === 1) {
      this.clearSubViews();
    }

    this._collection.each(this._addItem, this);

    let className = 'MapsList';

    if (this._collection._ITEMS_PER_PAGE * this._collection.options.get('page') >= this._collection.total_entries) {
      className += ' is-bottom';
    }

    this.$el.attr('class', className);

    if (this._collection.size() > 0) {
      this._fillEmptySlotsWithPlaceholderItems();
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._collection, 'reset loaded', this.render);
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

  _fillEmptySlotsWithPlaceholderItems: function () {
    _.times(this._emptySlotsCount(), function () {
      var view = new PlaceholderItem();
      this.$el.append(view.render().el);
      this.addView(view);
    }, this);
  },

  _emptySlotsCount: function () {
    return (this._collection._ITEMS_PER_PAGE - this._collection.size()) % MAP_CARDS_PER_ROW;
  }
});
