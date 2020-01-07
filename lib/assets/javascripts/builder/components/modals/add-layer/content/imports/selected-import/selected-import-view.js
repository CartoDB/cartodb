var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var SelectedImportHeaderView = require('./selected-import-header-view');
var HubspotRequest = require('../hubspot-request');

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
    'click .js-connectnow': '_onConnectClick',
    'click .js-back': '_showImportsSelector'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:state', this._initImportSubView, this);
  },

  _initViews: function () {
    this._initImportHeaderSubView();
    this._initImportSubView();
  },

  _initImportHeaderSubView: function () {
    var selectedImportHeader = new SelectedImportHeaderView({
      title: this._model.get('title'),
      name: this._model.get('name'),
      beta: this._model.get('beta')
    });
    selectedImportHeader.bind('showImportsSelector', this._showImportsSelector, this);
    selectedImportHeader.bind('renderSelectedImportView', this._renderSelectedImportView, this);
    this.$el.append(selectedImportHeader.render().el);
    this.addView(selectedImportHeader);
  },

  _initImportSubView: function () {
    this._importView.options.state = this._model.get('state');
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
    this._model.set('state', 'loading');

    var connectorName = this._model.get('title');
    var requestType = this._getRequestStatus();
    var data = HubspotRequest.getFormData(this._userModel, connectorName, requestType);

    var self = this;
    HubspotRequest.requestConnectorHubspot(data,
      function () {
        self._model.set('state', 'success');
      },
      function () {
        self._model.set('state', 'error');
      });
  },

  _getRequestStatus: function () {
    var status = this._model.get('status');
    if (status === 'disabled') {
      return 'enable';
    }
    return status;
  }
});
