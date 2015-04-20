var cdb = require('cartodb.js');
var TypeGuessingTogglerView = require('./footer/type_guessing_toggler_view');

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
    'click .js-start': 'startTutorial'
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_footer');

    this.typeGuessingTogglerView = new TypeGuessingTogglerView({
      model: this.createModel
    });
    this.addView(this.typeGuessingTogglerView);

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var userCanUpgrade = window.upgrade_url && !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin() );

    this.$el.html(
      this.template({
        isMapType: this.createModel.isMapType(),
        typeGuessing: this.createModel.upload.get('type_guessing'),
        option: this.createModel.getOption(),
        listingState: this.createModel.get('listing'),
        isLibrary: this.createModel.visFetchModel.get('library'),
        importState: this.createModel.getImportState(),
        isUploadValid: this.createModel.upload.isValidToUpload(),
        selectedDatasetsCount: this.createModel.getSelectedDatasets().length,
        maxSelectedDatasets: this.user.get('max_layers') || 10,
        mapTemplate: this.createModel.get('mapTemplate'),
        userCanUpgrade: userCanUpgrade,
        upgradeUrl: window.upgrade_url,
        currentUrl: window.location.href
      })
    );
    this.$('.js-footer-info').append(this.typeGuessingTogglerView.render().el);

    return this;
  },

  _initBinds: function() {
    this.createModel.bind('change:upload', this.render, this);
    this.createModel.bind('change:option', this.render, this);
    this.createModel.bind('change:listing', this.render, this);
    this.createModel.collection.bind('change:selected', this.render, this);
    this.createModel.visFetchModel.bind('change:library', this.render, this);
    this.createModel.upload.bind('change:type_guessing', this.render, this);
    this.add_related_model(this.createModel);
    this.add_related_model(this.createModel.visFetchModel);
  },

  _connectDataset: function() {
    if (this.createModel.upload.isValidToUpload()) {
      this.createModel.startUpload();
    }
  },

  startTutorial: function(e) {
    if (e) this.killEvent(e);
    this.createModel.startTutorial();
  },

  _goToTemplates: function(e) {
    if (e) e.preventDefault();
    this.createModel.set('option', 'templates');
  },

  _createMap: function() {
    var selectedDatasets = this.createModel.getSelectedDatasets();
    if (selectedDatasets.length > 0 && selectedDatasets.length <= this.user.get('max_layers')) {
      this.createModel.createMap();
    }
  }

});
