/*  Check and perform a reset of the styles due to a change over a node definition model (if possible).
 *
 *  In order to use and test this function in any view, we have removed this code
 *  from user-actions Class.
 */

module.exports = function (nodeDefModel, layerDefModel, forceStyleUpdate) {
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
      var unbindNodeChangeStatus = function () {
        queryGeometryModel.unbind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
        querySchemaModel.unbind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
      };

      var applyStylesAndSave = function () {
        var simpleGeometryType = queryGeometryModel.get('simple_geom');
        if (simpleGeometryType) {
          styleModel.setDefaultPropertiesByType('simple', simpleGeometryType);
        } else {
          styleModel.setDefaultPropertiesByType('none'); // fallback if there is no known geometry
        }
        layerDefModel.save();
      };

      if (queryGeometryModel.isFetching() || querySchemaModel.isFetching()) { // Wait until fetched
        return;
      } else if (!queryGeometryModel.isFetching() && !queryGeometryModel.isFetched() &&
        !querySchemaModel.isFetching() && !querySchemaModel.isFetched()) { // Node status has been resetted
        unbindNodeChangeStatus();
        return;
      } else { // Fetched!
        unbindNodeChangeStatus();
      }

      // If the geometry doesn't change and all columns used for style-def-model are still present + the styles are not custom
      // we can reset the style form with the geometry provided
      var haveDifferentSchema = querySchemaModel.hasDifferentSchemaThan(styleModel.getColumnsUsedForStyle());
      if (
          !forceStyleUpdate && (
            (!queryGeometryModel.hasChanged('simple_geom') && !haveDifferentSchema) ||
            layerDefModel.get('custom_cartocss')
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

    queryGeometryModel.bind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
    querySchemaModel.bind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);

    if (!queryGeometryModel.isFetching() && queryGeometryModel.canFetch()) {
      queryGeometryModel.fetch();
    }
    if (!querySchemaModel.isFetching() && querySchemaModel.canFetch()) {
      querySchemaModel.fetch();
    }
  };

  queryGeometryModel.bind(CHANGE_READY, onQueryGeometryAndSchemaReady);
  querySchemaModel.bind(CHANGE_READY, onQueryGeometryAndSchemaReady);
  onQueryGeometryAndSchemaReady();
};
