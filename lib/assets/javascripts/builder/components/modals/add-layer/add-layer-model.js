var Backbone = require('backbone');
var UploadModel = require('builder/data/upload-model');
var VisualizationFetchModel = require('builder/data/visualizations-fetch-model');
var TablesCollection = require('builder/data/visualizations-collection');
var TableModel = require('builder/data/table-model');

var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var IMPORT = 'import';
var DATASETS = 'datasets';
var SCRATCH = 'scratch';

var IMPORT_FILE = 'file';
var IMPORT_TWITTER = 'twitter';

var REQUIRED_OPTS = [
  'userModel',
  'userActions',
  'configModel',
  'pollingModel'
];

/**
 * Add layer model
 *
 * "Implements" the CreateListingModel.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    type: 'addLayer',
    contentPane: 'listing', // [listing, loading]
    listing: DATASETS, // [IMPORT, DATASETS, SCRATCH]
    collectionFetched: false,
    activeImportPane: IMPORT_FILE
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
    this._fetchCollection();
  },

  _initModels: function () {
    this._uploadModel = new UploadModel({
      create_vis: false
    }, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    this._selectedDatasetsCollection = new Backbone.Collection();

    this._tablesCollection = new TablesCollection([], {
      configModel: this._configModel
    });

    this._visualizationFetchModel = new VisualizationFetchModel({
      content_type: DATASETS,
      library: this.showLibrary()
    });
  },

  getTablesCollection: function () {
    return this._tablesCollection;
  },

  getSelectedDatasetsCollection: function () {
    return this._selectedDatasetsCollection;
  },

  getVisualizationFetchModel: function () {
    return this._visualizationFetchModel;
  },

  getUploadModel: function () {
    return this._uploadModel;
  },

  canSelect: function (dataset) {
    return dataset.get('selected') || this._selectedDatasetsCollection.length < 1; // for now only allow 1 item
  },

  showLibrary: function () {
    return false;
  },

  showDatasets: function () {
    return true;
  },

  setActiveImportPane: function (name) {
    this.set('activeImportPane', name);
  },

  canFinish: function () {
    if (this._atImportPane()) {
      return this._uploadModel.isValidToUpload();
    } else if (this._atDatasetsPane()) {
      return this._selectedDatasetsCollection.length > 0;
    }
  },

  finish: function () {
    if (this._atImportPane()) {
      this._pollingModel.trigger('importByUploadData', this._uploadModel.toJSON(), this);
    } else if (this._atDatasetsPane()) {
      var mdl = this._selectedDatasetsCollection.at(0);
      if (mdl.get('type') === 'remote') {
        var d = {
          create_vis: false,
          type: 'remote',
          value: mdl.get('name'),
          remote_visualization_id: mdl.get('id'),
          size: mdl.get('external_source') ? mdl.get('external_source').size : undefined
        };
        // See BackgroundImporter where the same event is bound to be handled..
        this._pollingModel.trigger('importByUploadData', d, this);
      } else {
        this._addNewLayer(mdl.getTableModel());
      }
    }
  },

  getImportState: function () {
    return this.get('activeImportPane');
  },

  showGuessingToggler: function () {
    return this._atImportPane();
  },

  showPrivacyToggler: function () {
    var hiddenDueToDeprecation = this._atTwitterImportPane() && !this._userModel.hasOwnTwitterCredentials();
    var hasToBeShowed = this._atImportPane() && !hiddenDueToDeprecation;
    return hasToBeShowed;
  },

  _atImportPane: function () {
    return this.get('listing') === IMPORT;
  },

  _atDatasetsPane: function () {
    return this.get('listing') === DATASETS;
  },

  _atScratchPane: function () {
    return this.get('listing') === SCRATCH;
  },

  _atTwitterImportPane: function () {
    return this.get('activeImportPane') === IMPORT_TWITTER;
  },

  createFromScratch: function () {
    var self = this;
    this.set('contentPane', 'creatingFromScratch');
    var tableModel = new TableModel({}, {
      configModel: this._configModel
    });
    tableModel.save({}, {
      success: function () {
        self._addNewLayer(tableModel, true);
      },
      error: function (req, resp) {
        if (resp.responseText.indexOf('You have reached your table quota') !== -1) {
          self.set('contentPane', 'datasetQuotaExceeded');
        } else {
          self.set('contentPane', 'addLayerFailed');
        }
      }
    });
  },

  _initBinds: function () {
    this._uploadModel.bind('change', function () {
      this.trigger('change:upload', this);
    }, this);
    this._visualizationFetchModel.bind('change', this._fetchCollection, this);
    this.bind('change:listing', this._fetchCollection, this);

    this._tablesCollection.bind('change:selected', function (changedModel, wasSelected) {
      this._selectedDatasetsCollection[wasSelected ? 'add' : 'remove'](changedModel);
    }, this);
    this._tablesCollection.bind('sync', function () {
      this._selectedDatasetsCollection.each(function (model) {
        var sameModel = this._tablesCollection.get(model.id);
        if (sameModel) {
          sameModel.set('selected', true);
        }
      }, this);
    }, this);
  },

  _fetchCollection: function () {
    var params = this._visualizationFetchModel.attributes;
    var types;

    if (this._visualizationFetchModel.isSearching()) {
      // Supporting search in data library and user datasets at the same time
      types = 'table,remote';
    } else {
      types = params.library ? 'remote' : 'table';
    }

    this._tablesCollection.fetch({
      data: {
        locked: '',
        q: params.q,
        page: params.page,
        tags: params.tag,
        shared: params.shared,
        only_liked: params.liked,
        type: '',
        types: types
      }
    });
  },

  _onCollectionChange: function () {
    this._selectedDatasetsCollection.reset(
      this._tablesCollection.where({ selected: true })
    );
  },

  _addNewLayer: function (tableModel, empty) {
    this.set('contentPane', 'addingNewLayer');

    this._userActions.createLayerFromTable(tableModel, {
      success: function (model) {
        this._userModel.updateTableCount();
        this.trigger('addLayerDone');
        MetricsTracker.track(MetricsTypes.CREATED_LAYER, {
          empty: !!empty,
          layer_id: model.get('id')
        });
      }.bind(this),
      error: function (req, resp) {
        if (resp.responseText.indexOf('You have reached your table quota') !== -1) {
          this.set('contentPane', 'datasetQuotaExceeded');
        } else {
          this.set('contentPane', 'addLayerFailed');
        }
      }.bind(this)
    });
  }
});
