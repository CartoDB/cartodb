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
    current_page:   1,
    q:              '',
    tag:            '',
    shared:         false,
    locked:         false,
    liked:          false,
    library:        false
  },

  initialize: function(args) {
    this.rootUrl = args.rootUrl;

    // Methods used in _compose need to have the model's context bound to be able to access internal attrs.
    _.bindAll(this, '_appendSearch', '_appendLocked', '_appendSharedOrLiked');
  },

  /**
   * Get the URL based on current state, se args for possible modifiers
   *
   * Options that are ommitted are attached from current state, if there is any.
   *
   * @param opts {Object}
   *   search: {String} E.g. 'foobar' or ':tag'
   *   page: {Number,String} 24, '42'
   * @returns {String}
   */
  url: function(opts) {
    opts = opts || {};
    return _.compose(
      _.partial(this._appendPage, opts.page),
      _.partial(this._appendSearch, opts.search),
      this._appendLocked,
      this._appendSharedOrLiked
    )(this._base())
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
   *
   * @param page {String,Number}
   * @param array {Array}
   * @returns {Array}
   * @private
   */
  _appendPage: function(page, array) {
    if (page) {
      array.push(encodeURIComponent(page));
    }

    return array;
  },

  /**
   * Append search items to given array.
   * Can be either a search by string ['search', 'foboar'], or a tag, ['tag', 'baz'].
   *
   * @param value {String, Undefined}
   * @param array {Array}
   * @returns {Array}
   * @private
   */
  _appendSearch: function(value, array) {
    var items = [];

    if (_.isUndefined(value)) {
      var tag = this.get('tag');
      var q = this.get('q');
      if (tag) {
        items = this._searchItems('tag', tag);
      } else if (q) {
        items = this._searchItems('search', q);
      }
    } else {
      if (value.search(':') === 0) {
        items = this._searchItems('tag', value.replace(':', ''));
      } else if (!_.isEmpty(value)) {
        items = this._searchItems('search', value);
      }
    }

    return array.concat(items);
  },

  _searchItems: function(type, value) {
    return [ type, encodeURIComponent(value) ];
  },

  _appendLocked: function(array) {
    if (this.get('locked')) {
      array.push('locked');
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
