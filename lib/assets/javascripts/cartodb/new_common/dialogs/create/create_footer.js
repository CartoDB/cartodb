var cdb = require('cartodb.js');

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
    'click .js-guessing': '_setContentGuessing',
    'click .js-create_map': '_createMap',
    'click .js-connect': '_connectDataset'
  },
  
  initialize: function() {
    this.user = this.options.user;
    this.currentUserUrl = this.options.currentUserUrl;
    this.createModel = this.options.createModel
    this.model = new cdb.core.Model({ type_guessing: true });
    this.template = cdb.templates.getTemplate('new_common/views/create/create_footer');
    this._initBinds();
  },

  render: function() {
    var upgradeAccountUrl = this.currentUserUrl.toUpgradeAccount();
    var userCanUpgrade = !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin() );

    this.$el.html(
      this.template({
        type: this.createModel.get('type'),
        typeGuessing: this.model.get('type_guessing'),
        option: this.createModel.getOption(),
        listingState: this.createModel.getListingState(),
        datasetsState: this.createModel.getDatasetsState(),
        importState: this.createModel.getImportState(),
        enabledUpload: this._enabledUpload(),
        isUploadValid: this._validUpload(),
        selectedDatasets: this.createModel.getSelectedDatasets(),
        maxSelectedDatasets: this.user.get('max_layers') || 10,
        mapTemplate: this.createModel.get('mapTemplate'),
        customHosted: cdb.config.get('custom_com_hosted'),
        userCanUpgrade: userCanUpgrade,
        upgradeURL: upgradeAccountUrl
      })
    );
    return this;
  },

  _initBinds: function() {
    this.createModel.bind('change:upload', this.render, this);
    this.createModel.bind('change:option', this.render, this);
    this.createModel.bind('change:selectedDatasets', this.render, this);
    this.model.bind('change:type_guessing', this.render, this);
    this.add_related_model(this.createModel);
  },

  _connectDataset: function() {
    if (this._validUpload()) {
      var d = _.extend(this.createModel.getUpload(), { type_guessing: this.model.get('type_guessing') });
      this.createModel.setUpload(d);
      this.trigger('datasetSelected', this);
    }
  },

  _setContentGuessing: function() {
    if (this._validUpload()) {
      this.model.set('type_guessing', !this.model.get('type_guessing'));
    }
  },

  _enabledUpload: function() {
    var upload = this.createModel.getUpload();
    return upload && !_.isEmpty(upload)
  },

  _validUpload: function() {
    var upload = this.createModel.getUpload();
    return upload && !_.isEmpty(upload) && upload.value && upload.state !== "error";
  },

  _goToTemplates: function(e) {
    if (e) e.preventDefault();
    this.createModel.set('option', 'templates');
  },

  _createMap: function() {
    var selectedDatasets = this.createModel.getSelectedDatasets();
    if (selectedDatasets.length > 0 && selectedDatasets.length <= this.user.get('max_layers')) {
      this.createModel.set('option','loading');
      this.createModel.saveVis();
    } 
  }

});