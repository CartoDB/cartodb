var _ = require('underscore');
var ImportView = require('builder/components/modals/add-layer/content/imports/import-view');
var UploadModel = require('builder/data/upload-model');
var FormView = require('./import-data-form-view');
var HeaderView = require('./import-data-header-view');
var SelectedDatasetView = require('builder/components/modals/add-layer/content/imports/import-selected-dataset-view');
var template = require('./import-data.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

/**
 *  Import data panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *
 */

var REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'createModel',
  'privacyModel',
  'guessingModel'
];

module.exports = ImportView.extend({
  options: {
    fileExtensions: [],
    type: 'url',
    service: '',
    acceptSync: false,
    fileEnabled: false,
    formTemplate: '',
    headerTemplate: '',
    fileAttrs: {}
  },

  className: 'ImportPanel ImportDataPanel',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    this._initBinds();
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

  _initViews: function () {
    this.model.setFresh();

    var headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      userModel: this._userModel,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: this.options.headerTemplate
    });
    headerView.render();
    this.addView(headerView);

    var selected = new SelectedDatasetView({
      el: this.$('.DatasetSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);

    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      userModel: this._userModel,
      model: this.model,
      template: this.options.formTemplate,
      fileEnabled: this.options.fileEnabled
    });

    formView.bind('fileSelected', function () {
      selected.setOptions({
        acceptSync: false,
        fileAttrs: {
          ext: true,
          title: 'name',
          description: {
            content: [{
              name: 'size',
              format: 'size'
            }]
          }
        }
      });
    });

    formView.bind('urlSelected', function () {
      selected.setOptions({
        acceptSync: true,
        fileAttrs: {
          ext: false,
          title: '',
          description: ''
        }
      });
    });

    formView.bind('urlSubmitted', function () {
      this._finish();
    }.bind(this));

    formView.render();
    this.addView(formView);
  },

  _finish: function () {
    if (this._createModel.canFinish()) {
      this.model.setPrivacy(this._privacyModel.get('privacy'));
      this.model.setGuessing(this._guessingModel.get('guessing'));

      this._createModel.finish();
    }
  },

  _initBinds: function () {
    this.model.unbind('change:state', this._checkState, this);
    this.model.unbind('change', this._triggerChange, this);
    this.model.unbind('change', this._setUploadModel, this);

    this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
    this.model.bind('change', this._setUploadModel, this);
  },

  _setUploadModel: function (d) {
    if (!_.isEmpty(d.attributes)) {
      var uploadModel = this._createModel.getUploadModel();
      uploadModel.setFresh(d.attributes);
    }
  },

  _checkState: function () {
    if (this.model.previous('state') === 'selected') {
      this.model.set({
        type: undefined,
        value: '',
        service_name: '',
        service_item_id: '',
        interval: 0
      });
    }
  }

});
