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
var QuerySchemaModel = require('./data/query-schema-model');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var SynchronizationModel = require('./data/synchronization-model');
var VisTableModel = require('./data/visualization-table-model');
var DatasetUnlockModalView = require('./dataset/dataset-unlock-modal-view');
var EditorModel = require('./data/editor-model');
var UserModel = require('./data/user-model');
var HeaderView = require('./dataset/dataset-header/header-view');
var Notifier = require('./components/notifier/notifier');

var userData = window.userData;
var visData = window.visualizationData;
var tableData = window.tableData;
var frontendConfig = window.frontendConfig;

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);
var userModel = new UserModel(userData, { configModel: configModel });
var modals = new ModalsServiceModel();
var tableModel = new TableModel(tableData, { configModel: configModel });
var visModel = new VisTableModel(visData, { configModel: configModel });
var syncModel = new SynchronizationModel(visData.synchronization, { configModel: configModel });
var querySchemaModel = new QuerySchemaModel({
  query: 'SELECT * FROM ' + tableModel.getUnquotedName(),
  status: 'unfetched'
}, {
  configModel: configModel
});
var editorModel = new EditorModel();
var Router = new Backbone.Router();

Notifier.init({
  editorModel: editorModel
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
  querySchemaModel: querySchemaModel
});
datasetContentView.render();

var datasetOptionsView = new DatasetOptionsView({
  el: $('.js-datasetOptions'),
  router: Router,
  modals: modals,
  configModel: configModel,
  userModel: userModel,
  tableModel: tableModel,
  visModel: visModel,
  syncModel: syncModel,
  querySchemaModel: querySchemaModel
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
