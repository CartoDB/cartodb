const CoreView = require('backbone/core-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const randomQuote = require('builder/components/loading/random-quote.js');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'routerModel',
  'template'
];

/*
*  Content result default view
*/

module.exports = CoreView.extend({

  events: {
    'click .js-mail-link': '_onMailClick',
    'click .js-link': navigateThroughRouter,
    'click .js-connect': '_onConnectClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    this.$el.html(this._template({
      defaultUrl: this._routerModel.currentDashboardUrl(),
      page: this._routerModel.model.get('page'),
      tag: this._routerModel.model.get('tag'),
      q: this._routerModel.model.get('q'),
      shared: this._routerModel.model.get('shared'),
      liked: this._routerModel.model.get('liked'),
      locked: this._routerModel.model.get('locked'),
      library: this._routerModel.model.get('library'),
      isSearching: this._routerModel.model.isSearching(),
      quote: randomQuote(),
      type: this._routerModel.model.get('content_type'),
      totalItems: this.collection.size(),
      totalEntries: this.collection.total_entries
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._routerModel.model, 'change', this.render);
    this.listenTo(this.collection, 'remove add reset', this.render);
  },

  _onMailClick: function (event) {
    if (event) {
      event.stopPropagation();
    }
  },

  _onConnectClick: function (event) {
    if (event) {
      event.preventDefault();
    }

    this.trigger('connectDataset', this);
  }
});
