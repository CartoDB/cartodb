var checkAndBuildOpts = require('builder/helpers/required-opts');

var template = require('./import-database.tpl');
var UploadModel = require('builder/data/upload-model');
var ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
var ConnectFormView = require('./import-database-connect-form-view');
var QueryFormView = require('./import-database-query-form-view');
var SelectedDataset = require('./import-database-selected-dataset-view');

/**
 *  Import Databse
 *
 *  Main View for Import API DB Connectors
 */

var REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'service'
];

module.exports = ImportDataView.extend({

  options: {
    fileExtensions: [],
    type: 'service',
    service: 'postgres',
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
      service_name: this.options.service
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });
  },

  _initBinds: function () {
    this.model.unbind('change:state', this._checkState, this);
    this.model.unbind('change', this._triggerChange, this);
    // this.model.unbind('change', this._setUploadModel, this);

    this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
    // this.model.bind('change', this._setUploadModel, this);
  },

  _initViews: function () {
    var connectformView = new ConnectFormView({
      el: this.$('.ImportPanel-connectForm'),
      userModel: this._userModel,
      model: this.model,
      configModel: this._configModel,
      title: this.options.title,
      service: this.options.service
    });
    connectformView.render();
    this.addView(connectformView);
  }
});
