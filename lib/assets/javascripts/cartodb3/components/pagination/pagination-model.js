var Backbone = require('backbone');
var _ = require('underscore');

/**
 * View model intended to be responsible for pagination logic, and to be used in conjunction with a Pagination view.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    total_count: 0,
    per_page: 10,
    current_page: 1,
    display_count: 5,
    extras_display_count: 1,
    url_to: undefined
  },

  pagesCount: function () {
    return Math.max(
      Math.ceil(
        this.get('total_count') / this.get('per_page')
      ), 1);
  },

  isCurrentPage: function (page) {
    return this.get('current_page') === page;
  },

  shouldBeVisible: function () {
    var pagesCount = this.pagesCount();
    return this.get('total_count') > 0 && pagesCount > 1 && this.get('current_page') <= pagesCount;
  },

  urlTo: function (page) {
    if (this.hasUrl()) {
      return this.get('url_to')(page);
    }
  },

  hasUrl: function () {
    return typeof this.get('url_to') === 'function';
  },

  /**
   * Get the pages that are expected to be displayed.
   * The current page will be in the middle of the returned sequence.
   *
   * @returns {number[]} a sequence of Numbers
   */
  pagesToDisplay: function () {
    var rangeStart;

    if (this._inLowRange()) {
      rangeStart = 1;
    } else if (this._inHighRange()) {
      rangeStart = this.get('current_page') - this._startOffset();
    } else {
      // Somewhere between the low and high boundary
      rangeStart = this.pagesCount() - this.get('display_count') + 1;
    }
    rangeStart = Math.max(rangeStart, 1);

    return this._withExtraPages(
      _.range(rangeStart, this._rangeEnd(rangeStart))
    );
  },

  _withExtraPages: function (pagesRelativeToCurrentPage) {
    var lastPage = this.pagesCount();
    var extraCount = this.get('extras_display_count');
    var extraStartPages = _.range(1, extraCount + 1);
    var extraEndPages = _.range(lastPage - extraCount + 1, lastPage + 1);

    var startPagesDiff = pagesRelativeToCurrentPage[0] - extraStartPages.slice(-1)[0];
    if (startPagesDiff === 2) {
      // There is only one missing page in the gap, so add it
      extraStartPages.push(pagesRelativeToCurrentPage[0] - 1);
    } else if (startPagesDiff > 2) {
      // There are more hidden pages at low range, add padding at end
      extraStartPages.push(-1);
    }

    var endPagesDiff = extraEndPages[0] - pagesRelativeToCurrentPage.slice(-1);
    if (endPagesDiff === 2) {
      // There is only one missing page in the gap, so add it
      extraEndPages.unshift(extraEndPages[0] - 1);
    } if (endPagesDiff > 2) {
      // There are more hidden pages at high range, add padding at beginning
      extraEndPages.unshift(-2);
    }

    return _.union(extraStartPages, pagesRelativeToCurrentPage, extraEndPages);
  },

  _inLowRange: function () {
    return this.get('current_page') < this._startOffset();
  },

  _inHighRange: function () {
    return this.get('current_page') < this._highBoundary();
  },

  _highBoundary: function () {
    return this.pagesCount() - this._startOffset();
  },

  _startOffset: function () {
    return Math.floor(this.get('display_count') / 2);
  },

  _rangeEnd: function (rangeStart) {
    // If we are too close to the range end then cap to the pages count.
    return Math.min(rangeStart + this.get('display_count'), this.pagesCount() + 1);
  }
});
