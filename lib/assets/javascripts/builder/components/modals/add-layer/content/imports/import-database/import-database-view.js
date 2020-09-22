const checkAndBuildOpts = require('builder/helpers/required-opts');

const template = require('./import-database.tpl');
const UploadModel = require('builder/data/upload-model');
const ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
const ConnectFormView = require('./import-database-connect-form-view');
const HeaderView = require('./import-database-header-view');
const headerTemplate = require('./import-database-header.tpl');
const QueryFormView = require('./import-database-query-form-view');
const SelectedDataset = require('./import-database-selected-dataset-view');

/**
 *  Import Databse
 *
 *  Main View for Import API DB Connectors
 */

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'service'
];

module.exports = ImportDataView.extend({

  options: {
    fileExtensions: [],
    type: 'service',
    acceptSync: true,
    fileEnabled: false,
    fileAttrs: {
      ext: false,
      title: '',
      description: ''
    }
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template(this.options));
    this.model.set('state', 'idle');
    this._initViews();
    return this;
  },

  _initModels: function () {
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this._service
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });
  },

  _initBinds: function () {
    this.model.unbind('change:state', this._checkState, this);
    this.model.unbind('change', this._triggerChange, this);

    this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
  },

  _initViews: function () {
    const connectformView = new ConnectFormView({
      el: this.$('.ImportPanel-connectForm'),
      userModel: this._userModel,
      model: this.model,
      configModel: this._configModel,
      title: this.options.title,
      service: this._service,
      params: this.options.params
    });
    connectformView.render();
    this.addView(connectformView);

    const headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      userModel: this._userModel,
      collection: this.collection,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      title: this.options.title,
      template: headerTemplate
    });
    headerView.render();
    this.addView(headerView);

    // Data Form
    const formView = new QueryFormView({
      el: this.$('.ImportPanel-queryForm'),
      userModel: this._userModel,
      model: this.model,
      configModel: this._configModel,
      title: this.options.title,
      service: this.options.service,
      placeholder_query: this.options.placeholder_query,
      sql_hint: this.options.sql_hint
    });
    formView.render();
    this.addView(formView);

    // Dataset selected
    const selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);
  }
});
