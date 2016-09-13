var Utils = require('./helpers/utils');

var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}
var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('./data/config-model');
var TableModel = require('./data/table-model');
var DatasetContentView = require('./dataset/dataset-content/dataset-content-view');
var DatasetOptionsView = require('./dataset/dataset-options/dataset-options-view');
var QueryGeometryModel = require('./data/query-geometry-model');
var QuerySchemaModel = require('./data/query-schema-model');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var MetricsTracker = require('./components/metrics/metrics-tracker');
var SynchronizationModel = require('./data/synchronization-model');
var LayerDefinitionModel = require('./data/layer-definition-model');
var VisTableModel = require('./data/visualization-table-model');
var DatasetUnlockModalView = require('./dataset/dataset-unlock-modal-view');
var EditorModel = require('./data/editor-model');
var UserModel = require('./data/user-model');
var HeaderView = require('./dataset/dataset-header/header-view');
var Notifier = require('./components/notifier/notifier');
var UserGroupFetcher = require('./data/users-group-fetcher');
var SQLUtils = require('./helpers/sql-utils');

var userData = window.userData;
var visData = window.visualizationData;
var tableData = window.tableData;
var layersData = window.layersData;
var frontendConfig = window.frontendConfig;
var authTokens = window.authTokens;

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key,
      auth_tokens: authTokens
    },
    frontendConfig
  )
);
var userModel = new UserModel(userData, { configModel: configModel });

var modals = new ModalsServiceModel();
var tableModel = new TableModel(tableData, { parse: true, configModel: configModel });
var visModel = new VisTableModel(visData, { configModel: configModel });
var syncModel = new SynchronizationModel(visData.synchronization, { configModel: configModel });
var layersCollection = new Backbone.Collection(layersData);
var layerDataModel = layersCollection.find(function (mdl) {
  var kind = mdl.get('kind');
  return kind !== 'tiled' && kind !== 'plain';
});

var layerModel = new LayerDefinitionModel(layerDataModel.toJSON(), {
  configModel: configModel,
  parse: true
});

layerModel.url = function () {
  var baseUrl = configModel.get('base_url');
  return baseUrl + '/api/v1/maps/' + visData.map_id + '/layers/' + layerModel.id;
};

UserGroupFetcher.track({
  userModel: userModel,
  configModel: configModel,
  acl: visModel.getPermissionModel().acl
});

var tableName = tableModel.getUnqualifiedName();
var originalQuery = 'SELECT * FROM ' + Utils.safeTableNameQuoting(tableName);
var query = layerModel.get('sql') || originalQuery;
var isDefaultQuery = SQLUtils.isSameQuery(query, originalQuery);

var queryGeometryModel = new QueryGeometryModel({
  query: query,
  ready: true
}, {
  configModel: configModel
});
// Request geometries is case that the sql is custom, if not, follow
// what table info provides
if (isDefaultQuery) {
  var simpleGeom = tableModel.getGeometryType();
  queryGeometryModel.set({
    status: 'fetched',
    simple_geom: simpleGeom && simpleGeom[0]
  });
} else {
  queryGeometryModel.fetch();
}

var querySchemaModel = new QuerySchemaModel({
  query: query,
  status: 'unfetched'
}, {
  configModel: configModel
});
var editorModel = new EditorModel();
var Router = new Backbone.Router();

Notifier.init({
  editorModel: editorModel
});

MetricsTracker.init({
  userId: userModel.get('id'),
  visId: visModel.get('id'),
  configModel: configModel
});

var headerView = new HeaderView({
  router: Router,
  modals: modals,
  configModel: configModel,
  userModel: userModel,
  tableModel: tableModel,
  visModel: visModel,
  syncModel: syncModel,
  querySchemaModel: querySchemaModel
});
$('.js-info').append(headerView.render().el);

var datasetContentView = new DatasetContentView({
  el: $('.js-table'),
  modals: modals,
  userModel: userModel,
  tableModel: tableModel,
  syncModel: syncModel,
  configModel: configModel,
  queryGeometryModel: queryGeometryModel,
  querySchemaModel: querySchemaModel
});
datasetContentView.render();

var datasetOptionsView = new DatasetOptionsView({
  el: $('.js-datasetOptions'),
  editorModel: editorModel,
  router: Router,
  modals: modals,
  configModel: configModel,
  userModel: userModel,
  tableModel: tableModel,
  visModel: visModel,
  syncModel: syncModel,
  queryGeometryModel: queryGeometryModel,
  querySchemaModel: querySchemaModel,
  layerDefinitionModel: layerModel
});

datasetOptionsView.render();

var notifierView = Notifier.getView();
$('.js-notifier').append(notifierView.render().el);

var rootUrl = configModel.get('base_url').replace(window.location.origin, '') + '/dataset/';
Backbone.history.start({
  pushState: true,
  root: rootUrl
});

if (tableModel.isOwner(userModel) && visModel.get('locked')) {
  modals.create(function (modalModel) {
    return new DatasetUnlockModalView({
      modalModel: modalModel,
      visModel: visModel,
      configModel: configModel,
      tableName: tableModel.getUnquotedName()
    });
  });
}
