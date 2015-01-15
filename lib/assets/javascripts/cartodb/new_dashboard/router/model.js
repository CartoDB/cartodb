var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * Model that holds the dashboard state.
 * Expected to be used with the dashboard Router.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    rootUrl:        '',
    content_type:   '',
    page:           1,
    q:              '',
    tag:            '',
    category:       '',
    shared:         false,
    locked:         false,
    liked:          false,
    library:        false,
    order:          'updated_at'
  },

  initialize: function(args) {
    this.rootUrl = args.rootUrl;

    // Methods used in _compose need to have the model's context bound to be able to access internal attrs.
    _.bindAll(this, '_appendPage', '_appendSearch', '_appendLocked', '_appendSharedOrLiked');
  },

  /**
   * Get the URL based on current state.
   * Provide a hash to override current state's values for the returned URL.
   *
   * @param override {Object}
   *   search: {String,undefined} E.g. 'foobar', ':tag'
   *   page:   {Number,String,undefined} E.g. 24, '42'
   *   locked: {Boolean,undefined}
   * @returns {String}
   */
  url: function(override) {
    // Since JS is an object we can add the options directly on the start value and let each compose method attach its
    // path based on given options.
    var array = _.extend(this._base(), override);
    return _.compose(
      this._appendPage,
      this._appendSearch,
      this._appendLocked,
      this._appendSharedOrLiked
    )(array)
      .join('/');
  },

  /**
   * Get the URL to current content URL (datasets or maps).
   *
   * @returns {String}
   */
  contentUrl: function() {
    return this._base().join('/');
  },

  datasetsLibraryUrl: function() {
    return this.rootUrl +'/dashboard/datasets/library';
  },

  sharedUrl: function() {
    return this._noneStatefulUrl('shared');
  },

  likedUrl: function() {
    return this._noneStatefulUrl('liked');
  },

  lockedUrl: function() {
    return this._noneStatefulUrl('locked');
  },

  _noneStatefulUrl: function(path) {
    return this._base()
      .concat([ path ])
      .join('/');
  },

  _base: function() {
    return [ this.rootUrl, 'dashboard', this.get('content_type') ];
  },

  /**
   * Append pagination page item to given array.
   */
  _appendPage: function(array) {
    var value = array.page;

    if (_.isUndefined(value)) {
      value = this.get('page');
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
  _appendSearch: function(array) {
    var items = [];
    var value = array.search;

    if (_.isUndefined(value)) {
      var tag = this.get('tag');
      var q = this.get('q');
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

  _keyValueItems: function(key, value) {
    return [ key, encodeURIComponent(value) ];
  },

  _appendLocked: function(array) {
    var value = array.locked;

    if ((_.isUndefined(value) && this.get('locked')) || value) {
      array.push('locked')
    }

    return array;
  },

  _appendSharedOrLiked: function(array) {
    if (this.get('shared')) {
      array.push('shared');
    } else if (this.get('liked')) {
      array.push('liked');
    }

    return array;
  }
});
