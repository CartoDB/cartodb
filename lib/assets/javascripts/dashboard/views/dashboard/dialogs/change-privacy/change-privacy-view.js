const CoreView = require('backbone/core-view');
const TabPane = require('dashboard/components/tabpane/tabpane');
const StartView = require('./start-view');
const PrivacyOptions = require('./options-collection');
const loadingView = require('builder/components/loading/render-loading');
const failTemplate = require('dashboard/components/fail.tpl');
const ViewFactory = require('builder/components/view-factory');
const MapcapsCollection = require('builder/data/mapcaps-collection');
const PrivacyWarningView = require('builder/components/modals/privacy-warning/privacy-warning-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const VisualizationModel = require('dashboard/data/visualization-model');
const ShareView = require('dashboard/views/dashboard/dialogs/share/share-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'visModel',
  'configModel',
  'modals',
  'modalModel'
];

/**
 * Change privacy datasets/maps dialog.
 */
const ChangePrivacyView = CoreView.extend({
  events: {
    'click .ok': 'ok',
    'click .cancel': 'destroyDialog'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._privacyOptions = PrivacyOptions.byVisAndUser(this._visModel, this._userModel);
    this._privacyModal = new ModalsServiceModel();
    this._initViews();
    this._initBinds();
  },

  render: function () {
    return this._panes.getActivePane().render().el;
  },

  ok: function () {
    const selectedOption = this._privacyOptions.selectedOption();
    if (!selectedOption.canSave()) {
      return;
    }

    return this._shouldShowPrivacyWarning(selectedOption.get('privacy'))
      .then(shouldShowWarning => {
        this._panes.active('saving');

        if (shouldShowWarning) {
          this._checkPrivacyChange(
            () => this._savePrivacy(selectedOption),
            () => this._panes.active('start')
          );
        } else {
          this._savePrivacy(selectedOption);
        }
      });
  },

  destroyDialog: function () {
    this._modalModel.destroy();
  },

  _initViews: function () {
    this._panes = new TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('start',
      new StartView({
        privacyOptions: this._privacyOptions,
        userModel: this._userModel,
        visModel: this._visModel,
        configModel: this._configModel
      })
    );
    this._panes.addTab('saving',
      ViewFactory.createByHTML(loadingView({
        title: 'Saving privacy…'
      }))
    );
    this._panes.addTab('saveFail',
      ViewFactory.createByHTML(failTemplate({
        msg: ''
      }))
    );
    this._panes.active('start');
  },

  _initBinds: function () {
    this._panes.bind('tabEnabled', this.render, this);
    this._panes.getPane('start').bind('clickedShare', this._openShareDialog, this);
  },

  _openShareDialog: function () {
    this._modals.create(modalModel => {
      // Order matters, close this dialog before appending the share one, for side-effects to work as expected (body.is-inDialog)
      return new ShareView({
        configModel: this._configModel,
        userModel: this._userModel,
        visModel: this._visModel,
        modals: this._modals,
        modalModel,
        onClose: this._onShareClose
      });
    });
  },

  _onShareClose: function () {
    this._modals.create(modalModel => {
      return new ChangePrivacyView({
        visModel: this._visModel,
        userModel: this._userModel,
        configModel: this._configModel,
        modals: this._modals,
        modalModel
      });
    });
  },

  _shouldShowPrivacyWarning: function (privacyState) {
    if (this._userModel.hasAccountType('FREE')) {
      return Promise.resolve(false);
    }

    const isPubliclyAvailable = VisualizationModel.isPubliclyAvailable(privacyState);

    if (this._visModel.isVisualization()) {
      this._panes.active('saving');

      const mapcapsCollection = new MapcapsCollection(null, {
        visDefinitionModel: this._visModel
      });

      return new Promise((resolve, reject) => {
        mapcapsCollection.fetch({
          success: () => {
            resolve(!!mapcapsCollection.length && isPubliclyAvailable);
          },
          error: reject
        });
      });
    }

    return Promise.resolve(isPubliclyAvailable);
  },

  _savePrivacy: function (privacyOption) {
    privacyOption.saveToVis(this._visModel, {
      success: () => {
        this._modalModel.destroy();
      },
      error: () => {
        this._panes.active('saveFail');
      }
    });
  },

  _checkPrivacyChange: function (confirmCallback, dismissCallback) {
    this._privacyModal.create(modalModel => {
      return new PrivacyWarningView({
        modalModel: modalModel,
        onConfirm: confirmCallback,
        onDismiss: dismissCallback,
        type: this._visModel.isVisualization() ? 'visualization' : 'dataset'
      });
    });
  }
});

module.exports = ChangePrivacyView;
