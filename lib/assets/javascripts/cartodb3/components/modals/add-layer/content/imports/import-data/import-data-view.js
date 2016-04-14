var cdb = require('cartodb-deep-insights.js');
var ImportView = require('../import-view');
var UploadModel = require('../../../../../../data/upload-model');
var FormView = require('./import-data-form-view');
var HeaderView = require('./import-data-header-view');
var SelectedDatasetView = require('../import-selected-dataset-view');
var template = require('./import-data.tpl');

/**
 *  Import data panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *
 */

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
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
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
    formView.render();
    this.addView(formView);
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
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
