var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var SelectedImportHeaderView = require('./selected-import-header-view');

var REQUIRED_OPTS = [
  'model',
  'importView',
  'userModel'
];

/**
 *  Selected Import
 */

module.exports = CoreView.extend({
  events: {
    'click .js-connectnow': '_onConnectClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this._initViews();

    return this;
  },

  _initViews: function () {
    var selectedImportHeader = new SelectedImportHeaderView({
      title: this._model.get('title'),
      name: this._model.get('name'),
      model: this._uploadModel
    });
    selectedImportHeader.bind('showImportsSelector', this._showImportsSelector, this);
    selectedImportHeader.bind('renderSelectedImportView', this._renderSelectedImportView, this);
    this.$el.append(selectedImportHeader.render().el);
    this.addView(selectedImportHeader);

    this.$el.append(this._importView.render().el);
    this.addView(this._importView);
  },

  _showImportsSelector: function () {
    this.trigger('showImportsSelector', this);
  },

  _renderSelectedImportView: function (importSelected) {
    this.trigger('renderSelectedImportView', importSelected, this);
  },

  _onConnectClick: function () {
    /* Using V3 hubspot API
    https://api.hsforms.com/submissions/v3/integration/submit/:portalId/:formGuid */
    var hubspot_id = '474999';
    var form_id = '1644a76c-4876-45ae-aa85-2420cd3fb3ff';
    var url = `https://api.hsforms.com/submissions/v3/integration/submit/${hubspot_id}/${form_id}`;
    var data = this._getFormData(this._userModel);

    $.ajax({
      type: 'POST',
      url: url,
      data: JSON.stringify(data),
      dataType: 'json',
      contentType: 'application/json',
      success: function () {
        console.log('success');
      },
      error: function (e) {
        console.log('fail', e);
      }
    });
  },

  _getFormData: function (user) {
    return {
      'fields': [
        {
          'name': 'email',
          'value': user.get('email')
        },
        {
          'name': 'firstname',
          'value': user.get('name') || 'no_firstname'
        },
        {
          'name': 'lastname',
          'value': user.get('last_name') || 'no_last_name'
        },
        {
          'name': 'jobtitle',
          'value': user.get('job_role') || 'no_jobtitle'
        },
        {
          'name': 'company',
          'value': user.get('company') || 'no_company'
        },
        {
          'name': 'phone',
          'value': user.get('phone') || 'no_phone'
        },
        {
          'name': 'connector_request_type',
          'value': this._getRequestStatus()
        },
        {
          'name': 'connector_request_name',
          'value': this._model.get('title')
        }
      ]
    };
  },

  _getRequestStatus: function () {
    var status = this._model.get('status');
    if (status === 'disabled') {
      return 'enable';
    }
    return status;
  }
});
