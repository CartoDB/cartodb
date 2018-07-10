const FiltersCollection = require('./filters-collection');

/**
 * When including this filter into a {@link carto.source.SQL} or a {@link carto.source.Dataset}, the rows will be filtered by the conditions included within filters.
 *
 * This filter will group as many filters as you want and it will add them to the query returning the rows that match ANY of the filters to render the visualization.
 *
 * You can add or remove filters by invoking `.addFilter()` and `.removeFilter()`.
 *
 * @example
 * // Create a filter by room type, showing only private rooms
 * const roomTypeFilter = new carto.filter.Category('room_type', { eq: 'Private room' });
 * // Create a filter by price, showing only listings lower than or equal to 50€
 * const priceFilter = new carto.filter.Range('price', { lte: 50 });
 *
 * // Combine the filters with an OR operator, returning rows that match one or the other filter
 * const filterByRoomTypeOrPrice = new carto.filter.OR([ roomTypeFilter, priceFilter ]);
 *
 * // Add filters to the existing source
 * source.addFilter(filterByRoomTypeOrPrice);
 *
 * @class OR
 * @extends carto.filter.FiltersCollection
 * @memberof carto.filter
 * @api
 */
class OR extends FiltersCollection {
  /**
   * Create a OR group filter
   * @param {Array} filters - The filters to apply in the query
   */
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'OR';
  }
}

module.exports = OR;
