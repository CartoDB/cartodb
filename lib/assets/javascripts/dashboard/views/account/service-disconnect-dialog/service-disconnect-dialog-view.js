const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const ServiceInvalidate = require('dashboard/data/service-invalidate-model');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const template = require('./service-disconnect-dialog.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'serviceModel',
  'modalModel'
];

/**
 *  Disconnect service or help user to disconnect it
 *
 *  - It needs the service model
 */

module.exports = CoreView.extend({

  events: {
    'click .js-revoke': '_revokeAccess',
    'click .js-cancel': '_closeDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    CoreView.prototype.initialize.apply(this);

    this._initBinds();
  },

  render: function () {
    if (this.serviceModel.get('state') === 'loading') {
      return this.$el.html(
        loadingTemplate({
          title: 'Revoking access',
          descHTML: randomQuote()
        })
      );
    }

    return this.$el.html(template(this.serviceModel.attributes));
  },

  _initBinds: function () {
    this.listenTo(this.serviceModel, 'change:state', this._maybeReplaceContent);
  },

  _maybeReplaceContent: function () {
    if (this.serviceModel.get('state') !== 'error') {
      this.render();
    }
  },

  _revokeAccess: function () {
    const invalidateModel = new ServiceInvalidate({ datasource: this.serviceModel.get('name') });
    this.serviceModel.set('state', 'loading');

    invalidateModel.destroy({
      success: (model, response) => {
        if (response.success) {
          this._reloadWindow();
        } else {
          this._setErrorState();
        }
      },
      error: () => this._setErrorState()
    });
  },

  _setErrorState: function () {
    this.serviceModel.set('state', 'error');
    this._closeDialog();
  },

  _reloadWindow: function () {
    window.location.reload();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
