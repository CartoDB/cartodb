var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}
var Locale = require('locale/index');
var Polyglot = require('node-polyglot');
require('promise-polyfill');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var ModalsServiceModel = require('builder/components/modals/modals-service-model');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var TableModel = require('builder/data/table-model');
var VisTableModel = require('builder/data/visualization-table-model');
var DatasetUnlockModalView = require('builder/dataset/dataset-unlock-modal-view');
var EditorModel = require('builder/data/editor-model');
var UserModel = require('builder/data/user-model');
var Notifier = require('builder/components/notifier/notifier');
var UserGroupFetcher = require('builder/data/users-group-fetcher');
var SQLUtils = require('builder/helpers/sql-utils');
var layerTypesAndKinds = require('builder/data/layer-types-and-kinds');
var DatasetView = require('builder/dataset/dataset-view');

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
var editorModel = new EditorModel();
var Router = new Backbone.Router();
var visModel = new VisTableModel(visData, { configModel: configModel });
var layersCollection = new Backbone.Collection(layersData);
var layerDataModel = layersCollection.find(function (mdl) {
  var kind = mdl.get('kind');
  return layerTypesAndKinds.isKindDataLayer(kind);
});

var layerModel = new LayerDefinitionModel(layerDataModel.toJSON(), {
  configModel: configModel,
  parse: true
});

layerModel.url = function () {
  var baseUrl = configModel.get('base_url');
  return baseUrl + '/api/v1/maps/' + visData.map_id + '/layers/' + layerModel.id;
};

// It is possible that a layer doesn't contain
if (!layerModel.get('sql')) {
  var defaultQuery = SQLUtils.getDefaultSQL(
    tableModel.getUnqualifiedName(),
    tableModel.get('permission').owner.username,
    userModel.isInsideOrg()
  );
  layerModel.set('sql', defaultQuery);
}

var analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
  table_name: tableData.name,
  query: layerModel.get('sql'),
  type: 'source',
  id: 'dummy-id'
}, {
  configModel: configModel,
  userModel: userModel,
  tableData: _.extend(
    tableData,
    {
      synchronization: visData.synchronization || {}
    }
  )
});

UserGroupFetcher.track({
  userModel: userModel,
  configModel: configModel,
  acl: visModel.getPermissionModel().acl
});

// Request geometries is case that the sql is custom, if not, follow
// what table info provides
var queryGeometryModel = analysisDefinitionNodeModel.queryGeometryModel;

if (!analysisDefinitionNodeModel.isCustomQueryApplied()) {
  var simpleGeom = tableModel.getGeometryType();
  queryGeometryModel.set({
    status: 'fetched',
    simple_geom: simpleGeom && simpleGeom[0]
  });
} else {
  queryGeometryModel.fetch();
}

Notifier.init({
  editorModel: editorModel
});

MetricsTracker.init({
  userId: userModel.get('id'),
  visId: visModel.get('id'),
  configModel: configModel
});

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

var datasetView = new DatasetView({
  router: Router,
  modals: modals,
  editorModel: editorModel,
  configModel: configModel,
  userModel: userModel,
  visModel: visModel,
  analysisDefinitionNodeModel: analysisDefinitionNodeModel,
  layerDefinitionModel: layerModel
});
$('body').prepend(datasetView.render().el);
