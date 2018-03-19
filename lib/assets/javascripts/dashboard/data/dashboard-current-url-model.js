var Backbone = require('backbone');
var UrlModel = require('dashboard/data/url-model');
var _ = require('underscore');

/**
 * Model that holds the dashboard state.
 * Expected to be used with the dashboard Router.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    dashboardUrl: undefined, // cdb.common.DashboardUrl
    visFetchModel: undefined // common/visualizations_fetch_model
  },

  initialize: function () {
    // Methods used in _compose need to have the model's context bound to be able to access internal attrs.
    _.bindAll(this, '_appendPage', '_appendSearch', '_appendLocked', '_appendLibrary', '_appendSharedOrLiked');
    if (!this.get('dashboardUrl')) {
      throw new Error('dashboardUrl is required');
    }
    if (!this.get('visFetchModel')) {
      throw new Error('visFetchModel is required');
    }
  },

  forCurrentContentType: function () {
    var contentType = this.get('visFetchModel').get('content_type') || 'datasets';
    // This might get called upon page initializatioin w/o any content_type set, fallback on datasets
    return this.get('dashboardUrl')[!this.isDeepInsights() ? contentType : 'deepInsights']();
  },

  /**
   * Get the URL based on current state.
   * Provide a hash to override current state's values for the returned URL.
   *
   * @param {Object} override hash that allows the following, optional keys:
   *   search: {String,undefined} E.g. 'foobar', ':tag'
   *   page:   {Number,String,undefined} E.g. 24, '42'
   *   locked: {Boolean,undefined}
   * @returns {Object} instance of UrlModel
   */
  forCurrentState: function (override) {
    // Since JS is an object we can add the options directly on the start value and let each compose method attach its
    // path based on given options.
    var array = _.extend([ this.forCurrentContentType() ], override);

    var baseUrl = _.compose(
      this._appendPage,
      this._appendSearch,
      this._appendLocked,
      this._appendLibrary,
      this._appendSharedOrLiked
    )(array)
      .join('/');

    return new UrlModel({
      base_url: baseUrl
    });
  },

  isSearching: function () {
    var visFetchModel = this.get('visFetchModel');
    return visFetchModel.get('q') || visFetchModel.get('tag');
  },

  isDeepInsights: function () {
    var visFetchModel = this.get('visFetchModel');
    return this.isMaps() && visFetchModel.get('deepInsights');
  },

  isDatasets: function () {
    return this.get('visFetchModel').get('content_type') === 'datasets';
  },

  isMaps: function () {
    return this.get('visFetchModel').get('content_type') === 'maps';
  },

  /**
   * Append pagination page item to given array.
   */
  _appendPage: function (array) {
    var value = array.page;

    if (_.isUndefined(value)) {
      value = this.get('visFetchModel').get('page');
    }

    // Ommit page if is first page
    if (value > 1) {
      array.push(encodeURIComponent(value));
    }

    return array;
  },

  /**
   * Append search items to given array.
   * Can be either a search by string ['search', 'foboar'], or a tag, ['tag', 'baz'].
   *
   * @param obj {Object}
   * @returns {Object}
   * @private
   */
  _appendSearch: function (array) {
    var items = [];
    var value = array.search;

    if (_.isUndefined(value)) {
      var visFetchModel = this.get('visFetchModel');
      var tag = visFetchModel.get('tag');
      var q = visFetchModel.get('q');
      if (tag) {
        items = this._keyValueItems('tag', tag);
      } else if (q) {
        items = this._keyValueItems('search', q);
      }
    } else {
      if (value.search(':') === 0) {
        items = this._keyValueItems('tag', value.replace(':', ''));
      } else if (!_.isEmpty(value)) {
        items = this._keyValueItems('search', value);
      }
    }

    // If used Array.prototype.concat would loose any properties array holds, since concat creates a copy of values only
    array.push.apply(array, items);
    return array;
  },

  _keyValueItems: function (key, value) {
    return [ key, encodeURIComponent(value) ];
  },

  _appendLocked: function (array) {
    var value = array.locked;

    if ((_.isUndefined(value) && this.get('visFetchModel').get('locked')) || value) {
      array.push('locked');
    }

    return array;
  },

  _appendLibrary: function (array) {
    var value = array.library;

    if ((_.isUndefined(value) && this.get('visFetchModel').get('library')) || value) {
      array.push('library');
    }

    return array;
  },

  _appendSharedOrLiked: function (array) {
    var shared = array.shared;
    var liked = array.liked;

    if ((_.isUndefined(shared) && this.get('visFetchModel').get('shared') === 'only') || shared === 'only') {
      array.push('shared');
    } else if ((_.isUndefined(liked) && this.get('visFetchModel').get('liked')) || liked) {
      array.push('liked');
    }

    return array;
  }
});
