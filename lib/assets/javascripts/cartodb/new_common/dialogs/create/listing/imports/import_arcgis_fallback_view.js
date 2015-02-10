var cdb = require('cartodb.js');

/**
 *  Import ArcGIS fallback panel
 *
 *  Shows message for ArcGIS disabled panel
 *
 */

module.exports = cdb.core.View.extend({

  options: {
    template: 'new_common/views/create/listing/import_arcgis_fallback'
  }
  
})