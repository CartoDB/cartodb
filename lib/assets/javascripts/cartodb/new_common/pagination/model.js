var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * View model intended to be responsible for pagination logic, and to be used in conjunction with a Pagination view.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    totalCount:        0,
    perPage:           10,
    page:              1,
    displayCount:      5,
    urlTo:             function(page) {
      throw new TypeError('Provide a url-function when instantiating a pagination model, ' +
        'it should return a URL for the given page argument.');
    }
  },

  pagesCount: function() {
    return Math.max(
      Math.ceil(
        this.get('totalCount') / this.get('perPage')
      ), 1);
  },

  isCurrentPage: function(page) {
    return this.get('page') === page;
  },

  urlTo: function(page) {
    return this.get('urlTo')(page);
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
      rangeStart = this.get('page') - this._startOffset();
    } else {
      // Somewhere between the low and high boundary
      rangeStart = this.pagesCount() - this.get('displayCount') +1;
    }
    rangeStart = Math.max(rangeStart, 1);

    return _.range(rangeStart, this._rangeEnd(rangeStart));
  },

  _inLowRange: function() {
    return this.get('page') < this._startOffset();
  },

  _inHighRange: function() {
    return this.get('page') < this._highBoundary();
  },

  _highBoundary: function() {
    return this.pagesCount() - this._startOffset();
  },

  _startOffset: function() {
    return Math.floor(this.get('displayCount') / 2);
  },

  _rangeEnd: function(rangeStart) {
    // If we are too close to the range end then cap to the pages count.
    return Math.min(rangeStart + this.get('displayCount'), this.pagesCount() +1);
  }
});
