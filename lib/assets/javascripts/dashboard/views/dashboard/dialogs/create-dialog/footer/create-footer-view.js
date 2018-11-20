const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const GuessingTogglerView = require('builder/components/modals/add-layer/footer/guessing-toggler-view');
const PrivacyTogglerView = require('builder/components/modals/add-layer/footer/privacy-toggler-view');
const template = require('./dialog-footer.tpl');
const GAPusher = require('dashboard/common/analytics-pusher');

/**
 *  Create footer view
 *
 *  It will show possible choices depending the
 *  selected option and the state of the main model
 *
 */

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'createModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-templates': '_goToTemplates',
    'click .js-create_map': '_createMap',
    'click .js-connect': '_connectDataset'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._guessingModel = new Backbone.Model({ guessing: true });
    this._privacyModel = new Backbone.Model({
      privacy: this._userModel.canCreatePrivateDatasets() ? 'PRIVATE' : 'PUBLIC'
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    const userCanUpgrade = window.upgrade_url && !this._configModel.get('cartodb_com_hosted') && (!this._userModel.isInsideOrg() || this._userModel.isOrgOwner());

    this.$el.html(
      template({
        isMapType: this._createModel.isMapType(),
        option: this._createModel.getOption(),
        listingState: this._createModel.get('listing'),
        isLibrary: this._createModel.visFetchModel.get('library'),
        importState: this._createModel.getImportState(),
        isUploadValid: this._createModel.upload.isValidToUpload(),
        selectedDatasetsCount: this._createModel.selectedDatasets.length,
        maxSelectedDatasets: this._userModel.getMaxLayers(),
        mapTemplate: this._createModel.get('mapTemplate'),
        userCanUpgrade: userCanUpgrade,
        upgradeUrl: window.upgrade_url,
        currentUrl: window.location.href
      })
    );

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._createModel, 'change:upload', this.render);
    this.listenTo(this._createModel, 'change:option', this.render);
    this.listenTo(this._createModel, 'change:listing', this.render);
    this.listenTo(this._createModel.selectedDatasets, 'all', this.render);
    this.listenTo(this._createModel.visFetchModel, 'change:library', this.render);
  },

  _initViews: function () {
    this.guessingTogglerView = new GuessingTogglerView({
      guessingModel: this._guessingModel,
      createModel: this._createModel,
      configModel: this._configModel,
      privacyModel: this._privacyModel,
      userModel: this._userModel
    });
    this.$('.js-footer-info').append(this.guessingTogglerView.render().el);
    this.addView(this.guessingTogglerView);

    this.privacyTogglerView = new PrivacyTogglerView({
      privacyModel: this._privacyModel,
      userModel: this._userModel,
      createModel: this._createModel,
      configModel: this._configModel
    });
    this.$('.js-footerActions').prepend(this.privacyTogglerView.render().el);
    this.addView(this.privacyTogglerView);
  },

  _connectDataset: function () {
    if (this._createModel.upload.isValidToUpload()) {
      // Setting privacy for new import if toggler is enabled
      if (this._createModel.showPrivacyToggler()) {
        this._createModel.upload.set('privacy', this._privacyModel.get('privacy'));
      }
      // Set proper guessing values before starting the upload
      this._createModel.upload.setGuessing(this._guessingModel.get('guessing'));
      this._createModel.startUpload();
      this.trigger('destroyModal');
    }
  },

  _goToTemplates: function (e) {
    if (e) e.preventDefault();
    this._createModel.set('option', 'templates');
  },

  _createMap: function () {
    GAPusher({
      eventName: 'send',
      hitType: 'event',
      eventCategory: 'Create Map',
      eventAction: 'click',
      eventLabel: 'Add dataset modal'
    });

    const selectedDatasets = this._createModel.getSelectedDatasetsCollection();
    if (selectedDatasets.length > 0 && selectedDatasets.length <= this._userModel.getMaxLayers()) {
      this._createModel.createMap();
    }
  }

});
