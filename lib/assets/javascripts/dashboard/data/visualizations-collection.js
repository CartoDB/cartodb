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
 *   var visualizations = new cdb.admin.Visualizations()
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
    this.bind('update', this._checkPage, this);
    this.bind('add', this._fetchAgain, this);
  },

  model: function (attrs, opts) {
    const options = Object.assign(opts, { configModel: opts.collection._configModel });

    return new VisualizationModel(attrs, options);
  },

  getTotalPages: function () {
    return Math.ceil(this.total_entries / this.options.get('per_page'));
  },

  _checkPage: function () {
    var total = this.getTotalPages();

    if (this.options.get('page') > total) {
      this.options.set({ page: total + 1 });
    } else if (this.options.get('page') < 1) {
      this.options.set({ page: 1 });
    }
  },

  _createUrlOptions: function () {
    return _.compact(_(this.options.attributes).map(
      function (v, k) {
        return k + '=' + encodeURIComponent(v);
      }
    )).join('&');
  },

  url: function (method) {
    var u = '';

    // TODO: remove this workaround when bi-visualizations are included as
    // standard visualizations
    if (this.options.get('deepInsights')) {
      u += '/api/v1/bivisualizations';
      u += '?page=' + this.options.get('page') + '&per_page=' + this.options.get('per_page');
    } else {
      var version = this._configModel.urlVersion('visualizations', method);
      u += '/api/' + version + '/viz/';
      u += '?' + this._createUrlOptions();
    }

    return u;
  },

  remove: function (options) {
    this.total_entries--;
    this.elder('remove', options);
  },

  // add bindMap: false for all the visulizations
  // vis model does not need map information in dashboard
  parse: function (response) {
    this.total_entries = response.total_entries;
    this.slides && this.slides.reset(response.children);
    this.total_shared = response.total_shared;
    this.total_likes = response.total_likes;
    this.total_user_entries = response.total_user_entries;

    return _.map(response.visualizations, function (v) {
      v.bindMap = false;
      return v;
    });
  },

  create: function (m) {
    var dfd = $.Deferred();
    Backbone.Collection.prototype.create.call(this,
      m,
      {
        wait: true,
        success: function () {
          dfd.resolve();
        },
        error: function () {
          dfd.reject();
        }
      }
    );
    return dfd.promise();
  },

  fetch: function (opts) {
    var dfd = $.Deferred();
    var self = this;

    this.trigger('loading', this);

    $.when(Backbone.Collection.prototype.fetch.call(this, opts))
      .done(function (res) {
        self.trigger('loaded');
        dfd.resolve();
      })
      .fail(function (res) {
        self.trigger('loadFailed');
        dfd.reject(res);
      });

    return dfd.promise();
  }
});
