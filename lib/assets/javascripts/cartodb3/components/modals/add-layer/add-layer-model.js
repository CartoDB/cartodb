var cdb = require('cartodb.js');
var Backbone = require('backbone');
var UploadModel = require('../../../data/upload-model');
var VisualizationFetchModel = require('../../../data/visualizations-fetch-model');
var TablesCollection = require('../../../data/visualizations-collection');
var TableModel = require('../../../data/table-model');

/**
 * Add layer model
 *
 * "Implements" the CreateListingModel.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    type: 'addLayer',
    contentPane: 'listing', // [listing, loading]
    listing: 'datasets', // [import, datasets, scratch]
    collectionFetched: false,
    activeImportPane: 'file'
  },

  initialize: function (attrs, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._userModel = opts.userModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._configModel = opts.configModel;

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
      content_type: 'datasets',
      library: this.showLibrary()
    });
    this._initBinds();
    this._fetchCollection();
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
    if (this.get('listing') === 'import') {
      return this._uploadModel.isValidToUpload();
    } else if (this.get('listing') === 'datasets') {
      return this._selectedDatasetsCollection.length > 0;
    }
  },

  finish: function () {
    if (this.get('listing') === 'import') {
      cdb.god.trigger('importByUploadData', this._uploadModel.toJSON(), this);
    } else if (this.get('listing') === 'datasets') {
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
        cdb.god.trigger('importByUploadData', d, this);
      } else {
        this._addNewLayer(mdl.getTableModel());
      }
    }
  },

  getImportState: function () {
    return this.get('activeImportPane');
  },

  showGuessingToggler: function () {
    return this.get('listing') === 'import';
  },

  showPrivacyToggler: function () {
    return this.get('listing') === 'import';
  },

  createFromScratch: function () {
    var self = this;
    this.set('contentPane', 'creatingFromScratch');
    var tableModel = new TableModel({}, {
      configModel: this._configModel
    });
    tableModel.save({}, {
      success: function () {
        self._addNewLayer(tableModel);
      },
      error: function () {
        self.set('contentPane', 'addLayerFailed');
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
      this._selectedDatasetsCollection[ wasSelected ? 'add' : 'remove' ](changedModel);
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

  _addNewLayer: function (tableModel) {
    this.set('contentPane', 'addingNewLayer');
    var tableName = tableModel.get('name');

    this._layerDefinitionsCollection.createLayerForTable(tableName, {
      success: function () {
        this.trigger('addLayerDone');
      }.bind(this),
      error: function () {
        this.set('contentPane', 'addLayerFailed');
      }.bind(this)
    });
  }
});
