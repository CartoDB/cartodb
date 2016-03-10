// var ANALYSES_SCHEMAS = [
//   {
//     type: 'buffer',
//     params: {
//       source: {
//         type: 'NODE'
//       },
//       radio: {
//         type: 'NUMERIC'
//       }
//     }
//   },
//   {
//     type: 'moran',
//     params: {
//       numerator_column: {
//         type: 'TEXT'
//       },
//       denominator_column: {
//         type: 'TEXT'
//       },
//       significance: {
//         type: 'NUMERIC'
//       },
//       neighbours: {
//         type: 'NUMERIC'
//       },
//       permutations: {
//         type: 'NUMERIC'
//       },
//       w_type: {
//         type: 'ENUM(\'knn\',\'queen\')'
//       }
//     }
//   },
//   {
//     type: 'point-in-polygon',
//     params: {
//       points_source: {
//         type: 'NODE'
//       },
//       polygons_source: {
//         type: 'NODE'
//       }
//     }
//   },
//   {
//     type: 'source',
//     params: {
//       query: {
//         type: 'TEXT'
//       }
//     }
//   },
//   {
//     type: 'trade-area',
//     params: {
//       source: {
//         type: 'NODE'
//       },
//       kind: {
//         type: 'ENUM(\'walk\',\'drive\',\'bike\')'
//       },
//       time: {
//         type: 'NUMERIC'
//       }
//     }
//   }
// ];

// TODO: Generate this from ^ schema
var ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP = {
  'trade-area': ['source'],
  'estimated-population': ['source'],
  'union': ['source'],
  'point-in-polygon': ['points_source', 'polygons_source']
};

module.exports = ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP;
