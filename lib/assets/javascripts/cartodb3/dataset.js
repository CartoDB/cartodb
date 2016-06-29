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
var ConfigModel = require('./data/config-model');
var TableModel = require('./data/table-model');
var TableManager = require('./components/table/table-manager');
var QuerySchemaModel = require('./data/query-schema-model');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var SynchronizationModel = require('./data/synchronization-model');
var VisDefinitionModel = require('./data/vis-definition-model');
var HeaderView = require('./dataset/header-view');

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
var modals = new ModalsServiceModel();
var tableModel = new TableModel(tableData, {
  configModel: configModel
});
var visModel = new VisDefinitionModel(visData, {
  configModel: configModel
});
var syncModel = new SynchronizationModel(visData.synchronization, {
  configModel: configModel
});
var querySchemaModel = new QuerySchemaModel({
  query: 'SELECT * FROM ' + tableModel.get('name'),
  status: 'unfetched'
}, {
  configModel: configModel
});

var headerView = new HeaderView({
  modals: modals,
  tableModel: tableModel,
  visModel: visModel,
  syncModel: syncModel
});
$('.js-info').append(headerView.render().el);

var tableView = TableManager.create({
  className: 'Table--relative',
  querySchemaModel: querySchemaModel,
  tableName: tableModel.get('name'),
  readonly: !!syncModel.id,
  modals: modals,
  configModel: configModel
});
$('.js-table').append(tableView.render().el);
