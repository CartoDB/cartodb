var cdb = require('cartodb.js');
var _ = require('underscore');

var urlToStub = function() {
  throw new TypeError('Provide a url-function when instantiating a pagination model, ' +
    'it should return a URL for the given page argument.');
};

/**
 * View model intended to be responsible for pagination logic, and to be used in conjunction with a Pagination view.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    total_count:       0,
    per_page:          10,
    current_page:      1,
    display_count:     5,
    url_to:            urlToStub
  },

  /**
   * Make sure model cannot be set in a invalid state.
   *
   * @param attrs {Object} new attributes
   * @returns {Boolean} true if invalid
   */
  validate: function(attrs) {
    return attrs.current_page > this._calcPagesCount(attrs.total_count, attrs.per_page);
  },

  pagesCount: function() {
    return this._calcPagesCount(this.get('total_count'), this.get('per_page'));
  },

  isCurrentPage: function(page) {
    return this.get('current_page') === page;
  },

  urlTo: function(page) {
    return this.get('url_to')(page);
  },

  /**
   * Get the pages that are expected to be displayed.
   * The current page will be in the middle of the returned sequence.
   *
   * @returns {number[]} a sequence of Numbers
   */
  pagesToDisplay: function() {
    var rangeStart;

    if (this._inLowRange()) {
      rangeStart = 1;
    } else if (this._inHighRange()) {
      rangeStart = this.get('current_page') - this._startOffset();
    } else {
      // Somewhere between the low and high boundary
      rangeStart = this.pagesCount() - this.get('display_count') +1;
    }
    rangeStart = Math.max(rangeStart, 1);

    return _.range(rangeStart, this._rangeEnd(rangeStart));
  },

  _inLowRange: function() {
    return this.get('current_page') < this._startOffset();
  },

  _inHighRange: function() {
    return this.get('current_page') < this._highBoundary();
  },

  _highBoundary: function() {
    return this.pagesCount() - this._startOffset();
  },

  _startOffset: function() {
    return Math.floor(this.get('display_count') / 2);
  },

  _rangeEnd: function(rangeStart) {
    // If we are too close to the range end then cap to the pages count.
    return Math.min(rangeStart + this.get('display_count'), this.pagesCount() +1);
  },

  _calcPagesCount: function(totalCount, perPage) {
    return Math.max(Math.ceil(totalCount / perPage), 1);
  }
});
