/*  Check and perform a reset of the styles due to a change over a node definition model (if possible).
 *
 *  In order to use and test this function in any view, we have removed this code
 *  from user-actions Class.
 *
 *  forceStyleUpdate: it will reset the styles in any case, no matter the schema or the geometry.
 *  resetQueryReady:  set as false ready property for query-schema-model and query-geometry-model
 *                    in order to wait for a node change before checking if reset styles is necessary.
 *
 */

module.exports = function (nodeDefModel, layerDefModel, forceStyleUpdate, resetQueryReady) {
  if (!nodeDefModel) throw new Error('nodeDefModel is required');
  if (!layerDefModel) throw new Error('layerDefModel is required');

  var CHANGE_READY = 'change:ready';
  var onQueryGeometryAndSchemaReady;
  var styleModel = layerDefModel.styleModel;
  var queryGeometryModel = nodeDefModel.queryGeometryModel;
  var querySchemaModel = nodeDefModel.querySchemaModel;

  onQueryGeometryAndSchemaReady = function () {
    if (queryGeometryModel.get('ready') && querySchemaModel.get('ready')) {
      queryGeometryModel.unbind(CHANGE_READY, onQueryGeometryAndSchemaReady);
      querySchemaModel.unbind(CHANGE_READY, onQueryGeometryAndSchemaReady);
    } else {
      return; // wait until ready
    }

    var CHANGE_STATUS = 'change:status';
    var saveDefaultStylesIfStillRelevant;

    saveDefaultStylesIfStillRelevant = function () {
      var applyStylesAndSave = function () {
        var simpleGeometryType = queryGeometryModel.get('simple_geom');
        if (simpleGeometryType) {
          styleModel.setDefaultPropertiesByType('simple', simpleGeometryType);
        } else {
          styleModel.setDefaultPropertiesByType('none'); // fallback if there is no known geometry
        }
        layerDefModel.save();
      };

      var styleTypeApplied = styleModel.get('type');

      if (queryGeometryModel.isDone() && querySchemaModel.isDone()) {
        queryGeometryModel.unbind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
        querySchemaModel.unbind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
      } else {
        return; // wait until ready
      }

      // If the geometry doesn't change and all columns used for style-def-model are still present + the styles are not custom
      // we can reset the style form with the geometry provided
      var haveDifferentSchema = querySchemaModel.hasDifferentSchemaThan(styleModel.getColumnsUsedForStyle());
      if (
        styleTypeApplied !== 'none' &&
          !forceStyleUpdate && (
          (!queryGeometryModel.hasChanged('simple_geom') && !haveDifferentSchema) ||
            layerDefModel.get('cartocss_custom')
        )
      ) {
        return;
      }

      if ( // Only apply changes if:
        (
          layerDefModel.collection.contains(layerDefModel) && // layer still exist
          layerDefModel.get('source') === nodeDefModel.id // node is still the head of layer
        ) || forceStyleUpdate // we force the style update
      ) {
        applyStylesAndSave();
      }
    };

    saveDefaultStylesIfStillRelevant();

    if (!queryGeometryModel.isFetched()) {
      queryGeometryModel.bind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
    }

    if (!querySchemaModel.isFetched()) {
      querySchemaModel.bind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
    }
  };

  if (resetQueryReady) {
    queryGeometryModel.set('ready', false);
    querySchemaModel.set('ready', false);
  }

  queryGeometryModel.bind(CHANGE_READY, onQueryGeometryAndSchemaReady);
  querySchemaModel.bind(CHANGE_READY, onQueryGeometryAndSchemaReady);
  onQueryGeometryAndSchemaReady();
};
