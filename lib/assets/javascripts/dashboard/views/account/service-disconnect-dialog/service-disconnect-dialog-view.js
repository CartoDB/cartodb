const CoreView = require('backbone/core-view');
const randomQuote = require('builder/components/loading/random-quote');
const ServiceInvalidate = require('dashboard/data/service-invalidate-model');
const loadingTemplate = require('./loading.tpl');
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
    CoreView.prototype.initialize.apply(this);
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    if (this.model.get('state') === 'loading') {
      return this.$el.html(
        loadingTemplate({
          title: 'Revoking access',
          quote: randomQuote()
        })
      );
    }

    return this.$el.html(template(this.model.attributes));
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:state', this._maybeReplaceContent);
  },

  _maybeReplaceContent: function () {
    if (this.model.get('state') !== 'error') {
      this.render();
    }
  },

  _revokeAccess: function () {
    const invalidateModel = new ServiceInvalidate({ datasource: this.model.get('name') });
    this.model.set('state', 'loading');

    invalidateModel.destroy({
      success: (model, response) => {
        if (response.success) {
          this._reloadWindow();
        } else {
          this._setErrorState();
        }
      },
      error: () => {
        this._setErrorState();
      }
    });
  },

  _setErrorState: function () {
    this.model.set('state', 'error');
    this.close();
  },

  _reloadWindow: function () {
    window.location.reload();
  },

  _closeDialog: function () {
    this._modalModel.destroy();
  }
});
