const FiltersCollection = require('./filters-collection');

/**
 * AND Filter Group
 * SQL and Dataset source filter.
 *
 * When including this filter into a {@link carto.source.SQL} or a {@link carto.source.Dataset}, the rows will be filtered by the conditions included within filters.
 *
 * This filter will group as many filters as you want and it will add them to the query returning the rows that match ALL the filters to render the visualization.
 *
 * You can add or remove filters by invoking `.addFilter()` and `.removeFilter()`.
 *
 * @example
 * // Create a filter by room type, showing only private rooms
 * const roomTypeFilter = new carto.filter.Category('room_type', { eq: 'Private room' });
 * // Create a filter by price, showing only listings lower than or equal to 50€
 * const priceFilter = new carto.filter.Range('price', { lte: 50 });
 *
 * // Combine the filters with an AND condition, returning rows that match both filters
 * const filterByRoomTypeAndPrice = new carto.filter.AND([ roomTypeFilter, priceFilter ]);
 *
 * // Add filters to the existing source
 * source.addFilter(filterByRoomTypeAndPrice);
 *
 * @class AND
 * @memberof carto.filter
 * @api
 */
class AND extends FiltersCollection {
  constructor (filters) {
    super(filters);
    this.JOIN_OPERATOR = 'AND';
  }

  getSQL () {
    const sql = FiltersCollection.prototype.getSQL.apply(this);

    if (this.count() > 1) {
      return `(${sql})`;
    }

    return sql;
  }
}

module.exports = AND;
