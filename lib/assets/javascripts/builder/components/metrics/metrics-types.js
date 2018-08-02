// IMPORTANT: Events must be kept in sync with backend!
// See `/lib/carto/tracking/events.rb`

var METRIC_TYPES = {
  STYLED_BY_VALUE: 'Styled by value',
  DOWNLOADED_LAYER: 'Downloaded layer',
  CREATED_LAYER: 'Created Layer',
  MODIFIED_ANALYSIS: 'Modified analysis',
  CREATED_ANALYSIS: 'Created analysis',
  DELETED_ANALYSIS: 'Deleted analysis',
  DRAGGED_NODE: 'Dragged node',
  APPLIED_SQL: 'Applied sql',
  WEBGL_STATS: 'WebGL stats',
  USED_ADVANCED_MODE: 'Used advanced mode',
  AGGREGATED_GEOMETRIES: 'Aggregated geometries',
  MODIFIED_STYLE_FORM: 'Modified Style Form',
  CHANGED_DEFAULT_GEOMETRY: 'Changed default geometry',
  APPLIED_CARTOCSS: 'Applied Cartocss',
  VISITED_PRIVATE_PAGE: 'visited_private_page'
};

module.exports = METRIC_TYPES;
