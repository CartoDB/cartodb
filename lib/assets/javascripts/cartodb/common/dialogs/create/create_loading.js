var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var randomQuote = require('../../view_helpers/random_quote');

/**
 *  Create loading view
 *
 *  It will show a big loading when a new map is gonna be created
 *
 */

module.exports = cdb.core.View.extend({

  className: 'IntermediateInfo',
  tagName: 'div',

  initialize: function() {
    this.createModel = this.options.createModel;
    this.user = this.options.user;
    this.model = new cdb.core.Model({ state: 'loading', type: 'dataset' });
    this._initBinds();
  },

  render: function() {
    var currentImport = this.model.get('currentImport');
    var d = {
      createModelType: this.createModel.get('type'),
      type: this.model.get('type'),
      state: this.model.get('state'),
      currentImport: currentImport,
      currentImportName: currentImport && ( currentImport.upl.get('service_item_id') || currentImport.upl.get('value') ),
      tableIdsArray: this.model.get('tableIdsArray'),
      selectedDatasets: this.createModel.selectedDatasets,
      upgradeUrl: window.upgrade_url,
      freeTrial: this.user.get('show_trial_reminder'),
      quote: randomQuote()
    };

    if (currentImport) {
      d.err = currentImport.getError();
      d.err.item_queue_id = currentImport.get('id');
    }

    if (d.state === "error") {
      var sizeError = d.err && d.err.error_code && d.err.error_code == "8001";
      var userCanUpgrade = !cdb.config.get('cartodb_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgOwner());

      this.template = cdb.templates.getTemplate(
        sizeError && userCanUpgrade ?
          'common/views/create/create_loading_upgrade' :
          'common/views/create/create_loading_error'
      )
    } else {
      this.template = cdb.templates.getTemplate('common/views/create/create_loading');
    }

    this.$el.html( this.template(d) );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state change:tableIdsArray change:currentImport', this.render, this);
    // Dataset
    this.createModel.bind('datasetError', this._onDatasetError, this);
    this.createModel.bind('creatingDataset', this._creatingDataset, this);

    // Map
    this.createModel.bind('importingRemote', this._importingRemote, this);
    this.createModel.bind('importFailed', this._onImportFailed, this);
    this.createModel.bind('creatingMap', this._creatingMap, this);
    this.createModel.bind('mapError', this._onMapError, this);

    this.add_related_model(this.createModel);
  },

  _creatingDataset: function() {
    this.model.set({
      type: 'dataset',
      state: 'loading'
    });
  },

  _onDatasetError: function() {
    this.model.set({
      type: 'dataset',
      state: 'error'
    });
  },

  _importingRemote: function(m) {
    this.model.set(
      _.extend(
        m.toJSON(),
        {
          state: 'importing'
        }
      )
    );
  },

  _onImportFailed: function(m) {
    this.model.set(
      _.extend(
        m.toJSON(),
        {
          state: 'error'
        }
      )
    );
  },

  _creatingMap: function(m) {
    this.model.set(
      _.extend(
        m.toJSON(),
        {
          state: 'creating'
        }
      )
    );
  },

  _onMapError: function(m) {
    this.model.set(
      _.extend(
        m.toJSON(),
        {
          state: 'error'
        }
      )
    );
  }

});
