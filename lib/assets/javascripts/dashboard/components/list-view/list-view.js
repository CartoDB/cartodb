const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const DatasetsItem = require('dashboard/views/dashboard/list-view/datasets-item/datasets-item-view');
const MapsItem = require('dashboard/components/maps-item/maps-item-view');
const DeepInsightsItem = require('dashboard/components/deep-insights-item/deep-insights-item-view');
const PlaceholderItem = require('dashboard/views/dashboard/list-view/placeholder/placeholder-item-view');
const RemoteDatasetsItem = require('dashboard/views/dashboard/list-view/remote-datasets-item/remote-datasets-item-view');
const MapTemplates = require('dashboard/views/dashboard/map-templates');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const MAP_CARDS_PER_ROW = 3;

const REQUIRED_OPTS = [
  'routerModel',
  'userModel',
  'configModel',
  'modals'
];

/**
 *  View representing the list of items
 */

module.exports = CoreView.extend({
  tagName: 'ul',
  events: {},

  _ITEMS: {
    'remotes': RemoteDatasetsItem,
    'datasets': DatasetsItem,
    'deepInsights': DeepInsightsItem,
    'maps': MapsItem
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.attr('class', this._routerModel.model.isDatasets() ? 'DatasetsList' : 'MapsList');
    this.collection.each(this._addItem, this);

    if (this._routerModel.model.isMaps() && this.collection.size() > 0) {
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
    let type = this._routerModel.model.get('content_type');

    if (model.get('type') === 'remote' && this._routerModel.model.isDatasets()) {
      type = 'remotes';
    }

    if (this._routerModel.model.isDeepInsights()) {
      type = 'deepInsights';
    }

    const item = new this._ITEMS[type]({
      model,
      routerModel: this._routerModel,
      userModel: this._userModel,
      configModel: this._configModel,
      modals: this._modals
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'loading', this._onItemsLoading);
    this.listenTo(this.collection, 'reset sync', this.render);
  },

  _onItemsLoading: function () {
    this.$el.addClass('is-loading');
  },

  _fillEmptySlotsWithPlaceholderItems: function () {
    const mapTemplates = _.shuffle(MapTemplates);

    _.times(this._emptySlotsCount(), function (index) {
      var mapTemplate = mapTemplates[index];
      if (mapTemplate) {
        var model = new Backbone.Model(mapTemplate);
        var view = new PlaceholderItem({
          model,
          configModel: this._configModel,
          collection: this.collection
        });
        this.$el.append(view.render().el);
        this.addView(view);
      }
    }, this);
  },

  _emptySlotsCount: function () {
    return (this.collection._ITEMS_PER_PAGE - this.collection.size()) % MAP_CARDS_PER_ROW;
  }

});
