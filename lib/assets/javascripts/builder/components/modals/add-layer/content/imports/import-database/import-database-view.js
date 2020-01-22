const checkAndBuildOpts = require('builder/helpers/required-opts');

const template = require('./import-database.tpl');
const UploadModel = require('builder/data/upload-model');
const ImportDataView = require('builder/components/modals/add-layer/content/imports/import-data/import-data-view');
const ConnectFormView = require('./import-database-connect-form-view');

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
      service: this._service
    });
    connectformView.render();
    this.addView(connectformView);
  }
});
