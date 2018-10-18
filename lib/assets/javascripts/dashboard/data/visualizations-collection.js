const Backbone = require('backbone');
const _ = require('underscore');
const $ = require('jquery');
const VisualizationModel = require('dashboard/data/visualization-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * Visualizations endpoint available for a given user.
 *
 * Usage:
 *
 *   const visualizations = new VisualizationsCollection();
 *   visualizations.fetch();
 *
 */

module.exports = Backbone.Collection.extend({

  _PREVIEW_TABLES_PER_PAGE: 10,
  _TABLES_PER_PAGE: 20,
  _PREVIEW_ITEMS_PER_PAGE: 3,
  _ITEMS_PER_PAGE: 9,

  sync: require('dashboard/data/backbone/sync-abort'),

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var default_options = new Backbone.Model({
      tag_name: '',
      q: '',
      page: 1,
      type: 'derived',
      exclude_shared: false,
      per_page: this._ITEMS_PER_PAGE
    });

    this.options = _.extend(default_options, this.options);

    this.total_entries = 0;

    this.bind('reset', this._checkPage, this);
  },

  model: function (attrs, opts) {
    const options = { ...opts, configModel: opts.collection._configModel };

    return new VisualizationModel(attrs, options);
  },

  getTotalPages: function () {
    return Math.ceil(this.total_entries / this.options.get('per_page'));
  },

  _checkPage: function () {
    const total = this.getTotalPages();

    if (this.options.get('page') > total) {
      this.options.set({ page: total + 1 });
    } else if (this.options.get('page') < 1) {
      this.options.set({ page: 1 });
    }
  },

  _createUrlOptions: function () {
    const urlParams = _(this.options.attributes).map((v, k) => `${k}=${encodeURIComponent(v)}`);

    return _.compact(urlParams).join('&');
  },

  url: function (method) {
    const version = this._configModel.urlVersion('visualizations', method);

    return `/api/${version}/viz?${this._createUrlOptions()}`;
  },

  remove: function (options) {
    this.total_entries--;

    Backbone.Collection.prototype.remove.apply(this, arguments);
  },

  // add bindMap: false for all the visulizations
  // vis model does not need map information in dashboard
  parse: function (response) {
    this.total_entries = response.total_entries;
    this.slides && this.slides.reset(response.children);
    this.total_shared = response.total_shared;
    this.total_likes = response.total_likes;
    this.total_user_entries = response.total_user_entries;

    return response.visualizations.map(vis => ({ ...vis, bindMap: false }));
  },

  create: function (model) {
    const deferred = $.Deferred();

    Backbone.Collection.prototype.create.call(this,
      model,
      {
        wait: true,
        success: () => deferred.resolve(),
        error: () => deferred.reject()
      }
    );

    return deferred.promise();
  },

  fetch: function (opts) {
    var deferred = $.Deferred();
    var self = this;

    this.trigger('loading', this);

    $.when(Backbone.Collection.prototype.fetch.call(this, opts))
      .done(function (res) {
        self.trigger('loaded');
        deferred.resolve();
      })
      .fail(function (res) {
        self.trigger('loadFailed');
        deferred.reject(res);
      });

    return deferred.promise();
  },

  getTotalStat: function (attribute) {
    return this[attribute] || 0;
  },

  getDefaultParam: function (param) {}
});
