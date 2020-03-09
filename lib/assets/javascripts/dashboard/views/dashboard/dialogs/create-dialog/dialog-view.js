const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const template = require('./dialog-view.tpl');
const FooterView = require('./footer/create-footer-view');
const NavigationView = require('builder/components/modals/add-layer/content/navigation-view');
const ListingView = require('builder/components/modals/add-layer/content/listing-view');
const TabPaneView = require('builder/components/tab-pane/tab-pane-view');
const TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
const ViewFactory = require('builder/components/view-factory');
const renderLoading = require('builder/components/loading/render-loading');
const ErrorDetailsView = require('builder/components/background-importer/error-details-view');
const CreateMapModel = require('dashboard/views/dashboard/create-map-model');
const CreateDatasetModel = require('dashboard/views/dashboard/create-dataset-model');
const VisualizationModel = require('dashboard/data/visualization-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const DEFAULT_VIS_NAME = 'Untitled map';

const REQUIRED_OPTS = [
  'modalModel',
  'createModel',
  'configModel',
  'userModel',
  'pollingModel',
  'routerModel',
  'modalModel',
  'mamufasView'
];

/**
 * Create map/dataset dialog, typically used from editor
 */
const CreateDialogView = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();

    // Stop pollings and prevent import modal to appear
    this._mamufasView.disable();
    this._pollingModel.stopPollings();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._initViews();
    this._createModel.viewsReady();
  },

  _initModels: function () {
    this._guessingModel = new Backbone.Model({
      guessing: true
    });

    this._privacyModel = new Backbone.Model({
      privacy: this._userModel.canCreatePrivateDatasets() ? 'PRIVATE' : 'PUBLIC'
    });
  },

  _initBinds: function () {
    this.listenTo(this._createModel, 'change:contentPane', this._onChangeContentView);
    this.listenTo(this._createModel, 'toggleNavigation', this._toggleNavigation, this);
    this.listenTo(this._createModel, 'destroyModal', () => this._modalModel.destroy());
    this.listenTo(this._pollingModel, 'importByUploadData', this._modalModel.destroy.bind(this._modalModel));
  },

  _initViews: function () {
    this._navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      userModel: this._userModel,
      routerModel: this._createModel.getVisualizationFetchModel(),
      createModel: this._createModel,
      tablesCollection: this._createModel.getTablesCollection(),
      configModel: this._configModel
    });
    this._navigationView.render();
    this.addView(this._navigationView);

    this._tabPaneCollection = new TabPaneCollection([
      {
        name: 'listing',
        selected: this._createModel.get('contentPane') === 'listing',
        createContentView: () => {
          return new ListingView({
            createModel: this._createModel,
            configModel: this._configModel,
            userModel: this._userModel,
            privacyModel: this._privacyModel,
            guessingModel: this._guessingModel
          });
        }
      }, {
        name: 'creatingFromScratch',
        selected: this._createModel.get('contentPane') === 'creatingFromScratch',
        createContentView: () => {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-layer.create-loading-title')
            })
          );
        }
      }, {
        name: 'loading',
        selected: this._createModel.get('contentPane') === 'loading',
        createContentView: () => {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.create-dialog.creating-map')
            })
          );
        }
      }, {
        name: 'importFailed',
        selected: this._createModel.get('contentPane') === 'importFailed',
        createContentView: () => {
          const currentImport = this._createModel.get('currentImport');
          this._createModel.set('currentImport', null);

          return new ErrorDetailsView({
            error: currentImport && currentImport.getError(),
            userModel: this._userModel,
            configModel: this._configModel
          });
        }
      }, {
        name: 'datasetQuotaExceeded',
        selected: this._createModel.get('contentPane') === 'datasetQuotaExceeded',
        createContentView: () => {
          return new ErrorDetailsView({
            error: { errorCode: 8002 },
            userModel: this._userModel,
            configModel: this._configModel
          });
        }
      }
    ]);

    var tabPaneView = new TabPaneView({
      collection: this._tabPaneCollection
    });
    this.addView(tabPaneView);
    this.$('.js-content-container').append(tabPaneView.render().el);

    this._footerView = new FooterView({
      configModel: this._configModel,
      createModel: this._createModel,
      userModel: this._userModel,
      privacyModel: this._privacyModel,
      guessingModel: this._guessingModel
    });

    this._footerView.on('destroyModal', () => this._modalModel.destroy());

    this.addView(this._footerView);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _onChangeContentView: function () {
    var context = this._createModel.get('contentPane');
    var paneModel = _.first(this._tabPaneCollection.where({ name: context }));
    var paneModelName = paneModel.get('name');
    paneModel.set('selected', true);

    if (paneModelName === 'loading' || paneModelName === 'creatingFromScratch' || paneModelName === 'importFailed') {
      var hiddenStyle = {
        visibility: 'hidden',
        opacity: '0'
      };
      this._footerView.$el.css(hiddenStyle);
      this._navigationView.hide();
    }

    if (paneModelName !== 'listing') {
      this._navigationView.hide();
    }
  },

  _toggleNavigation: function (showNavigation) {
    showNavigation ? this._navigationView.show() : this._navigationView.hide();
  },

  clean: function () {
    this._mamufasView.enable();
    this._pollingModel.startPollings();

    CoreView.prototype.clean.apply(this, arguments);
  }
}, {
  setViewProperties: function (opts) {
    const mapModel = new CreateMapModel({}, {
      userModel: opts.userModel,
      configModel: opts.configModel,
      backgroundPollingModel: opts.pollingModel,
      backgroundPollingView: opts.pollingView
    });

    _.extend(this, {
      configModel: opts.configModel,
      userModel: opts.userModel,
      pollingModel: opts.pollingModel,
      pollingView: opts.pollingView,
      routerModel: opts.routerModel,
      mapModel
    });
  },

  addProperties: function (properties) {
    _.extend(this, properties);
  },

  openDialog: function (dialogDependencies, dialogOpts) {
    let createModel;

    if (dialogOpts.type === 'dataset') {
      createModel = new CreateDatasetModel({}, {
        userModel: this.userModel,
        configModel: this.configModel,
        backgroundPollingView: this.pollingView
      });
    } else {
      this.mapModel.set({
        listing: 'datasets',
        collectionFetched: false
      });
      this.mapModel.setSelected(dialogOpts.selectedItems);
      createModel = this.mapModel;
    }

    const dialogView = new CreateDialogView({
      modalModel: dialogDependencies.modalModel,
      configModel: this.configModel,
      createModel,
      userModel: this.userModel,
      pollingModel: this.pollingModel,
      routerModel: this.routerModel,
      mamufasView: this.mamufasView,
      el: dialogOpts.viewElement
    });

    createModel.bind('datasetError', function (resp) {
      if (resp.responseText.indexOf('You have reached your table quota') !== -1) {
        createModel.set('contentPane', 'datasetQuotaExceeded');
      }
    });

    createModel.bind('datasetCreated', tableMetadata => {
      let vis;

      if (this.routerModel.model.isDatasets()) {
        vis = new VisualizationModel({ type: 'table' }, { configModel: this.configModel });
        vis.permission.owner = this.userModel;
        vis.set('table', tableMetadata.toJSON());
        window.location = vis.viewUrl(this.userModel).edit();
      } else {
        vis = new VisualizationModel({ name: DEFAULT_VIS_NAME }, { configModel: this.configModel });
        vis.permission.owner = this.userModel;
        vis.save({
          tables: [ tableMetadata.get('id') ]
        }, {
          success: m => {
            window.location = vis.viewUrl(this.userModel).edit();
          },
          error: function (e) {
            dialogDependencies.modalModel.destroy();
          }
        });
      }
    });
    return dialogView;
  }
});

module.exports = CreateDialogView;
