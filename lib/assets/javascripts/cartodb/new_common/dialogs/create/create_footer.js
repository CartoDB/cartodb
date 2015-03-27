var cdb = require('cartodb.js');
var _ = require('underscore');

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
    'click .js-connect': '_connectDataset',
    'click .js-start': '_start'
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel
    this.model = new cdb.core.Model({ type_guessing: true });
    this.template = cdb.templates.getTemplate('new_common/views/create/create_footer');
    this._initBinds();
  },

  render: function() {
    var userCanUpgrade = window.upgrade_url && !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin() );

    this.$el.html(
      this.template({
        isMapType: this.createModel.isMapType(),
        typeGuessing: this.model.get('type_guessing'),
        option: this.createModel.getOption(),
        listingState: this.createModel.getListingState(),
        datasetsState: this.createModel.getDatasetsState(),
        importState: this.createModel.getImportState(),
        enabledUpload: this._enabledUpload(),
        isUploadValid: this._validUpload(),
        selectedDatasetsCount: this.createModel.getSelectedDatasets().length,
        maxSelectedDatasets: this.user.get('max_layers') || 10,
        mapTemplate: this.createModel.get('mapTemplate'),
        customHosted: cdb.config.get('custom_com_hosted'),
        userCanUpgrade: userCanUpgrade,
        upgradeUrl: window.upgrade_url,
        currentUrl: window.location.href
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

  _start: function(e) {
    if (e) this.killEvent(e);
    this.trigger('start', this);
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
