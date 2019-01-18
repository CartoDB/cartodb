var cdb = require('cartodb.js-v3');
var GuessingTogglerView = require('./footer/guessing_toggler_view');
var PrivacyTogglerView = require('./footer/privacy_toggler_view');
var GAPusher = require('../../analytics_pusher');

/**
 *  Create footer view
 *
 *  It will show possible choices depending the
 *  selected option and the state of the main model
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-templates': '_goToTemplates',
    'click .js-create_map': '_createMap',
    'click .js-connect': '_connectDataset',
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.guessingModel = new cdb.core.Model({ guessing: true });
    this.privacyModel = new cdb.core.Model({
      privacy: this.user.canCreatePrivateDatasets() ? 'PRIVATE' : 'PUBLIC'
    });
    this.template = cdb.templates.getTemplate('common/views/create/create_footer');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var userCanUpgrade = window.upgrade_url && !cdb.config.get('cartodb_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgOwner() );

    this.$el.html(
      this.template({
        isMapType: this.createModel.isMapType(),
        option: this.createModel.getOption(),
        listingState: this.createModel.get('listing'),
        isLibrary: this.createModel.visFetchModel.get('library'),
        importState: this.createModel.getImportState(),
        isUploadValid: this.createModel.upload.isValidToUpload(),
        selectedDatasetsCount: this.createModel.selectedDatasets.length,
        maxSelectedDatasets: this.user.getMaxLayers(),
        mapTemplate: this.createModel.get('mapTemplate'),
        userCanUpgrade: userCanUpgrade,
        upgradeUrl: window.upgrade_url,
        currentUrl: window.location.href
      })
    );

    this._initViews();

    return this;
  },

  _initBinds: function() {
    this.createModel.bind('change:upload', this.render, this);
    this.createModel.bind('change:option', this.render, this);
    this.createModel.bind('change:listing', this.render, this);
    this.createModel.selectedDatasets.bind('all', this.render, this);
    this.createModel.visFetchModel.bind('change:library', this.render, this);
    this.add_related_model(this.createModel);
    this.add_related_model(this.createModel.selectedDatasets);
    this.add_related_model(this.createModel.visFetchModel);
  },

  _initViews: function() {
    this.guessingTogglerView = new GuessingTogglerView({
      model: this.guessingModel,
      user: this.user,
      createModel: this.createModel
    });
    this.$('.js-footer-info').append(this.guessingTogglerView.render().el);
    this.addView(this.guessingTogglerView);

    this.privacyTogglerView = new PrivacyTogglerView({
      model: this.privacyModel,
      user: this.user,
      createModel: this.createModel
    });
    this.$('.js-footerActions').prepend(this.privacyTogglerView.render().el);
    this.addView(this.privacyTogglerView);
  },

  _connectDataset: function() {
    if (this.createModel.upload.isValidToUpload()) {
      // Setting privacy for new import if toggler is enabled
      if (this.createModel.showPrivacyToggler()) {
        this.createModel.upload.set('privacy', this.privacyModel.get('privacy'));
      }
      // Set proper guessing values before starting the upload
      this.createModel.upload.setGuessing(this.guessingModel.get('guessing'));
      this.createModel.startUpload();
    }
  },

  _goToTemplates: function(e) {
    if (e) e.preventDefault();
    this.createModel.set('option', 'templates');
  },

  _createMap: function() {
    GAPusher({
      eventName: 'send',
      hitType: 'event',
      eventCategory: 'Create Map',
      eventAction: 'click',
      eventLabel: 'Add dataset modal'
    });

    var selectedDatasets = this.createModel.selectedDatasets;
    if (selectedDatasets.length > 0 && selectedDatasets.length <= this.user.getMaxLayers()) {
      this.createModel.createMap();
    }
  }

});
