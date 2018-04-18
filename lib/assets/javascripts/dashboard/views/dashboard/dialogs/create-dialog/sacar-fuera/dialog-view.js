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
const ErrorView = require('builder/components/error/error-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const CreateMapModel = require('dashboard/views/dashboard/create-map-model');
const CreateDatasetModel = require('dashboard/views/dashboard/create-dataset-model');

const REQUIRED_OPTS = [
  'modalModel',
  'createModel',
  'configModel',
  'userModel',
  'pollingModel'
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
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._initViews();
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
    this.listenTo(this._createModel, 'addLayerDone', this._modalModel.destroy.bind(this._modalModel));
    this.listenTo(this._createModel, 'change:contentPane', this._onChangeContentView);
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
        name: 'addingNewLayer',
        selected: this._createModel.get('contentPane') === 'addingNewLayer',
        createContentView: () => {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-layer.adding-new-layer')
            })
          );
        }
      }, {
        name: 'addLayerFailed',
        selected: this._createModel.get('contentPane') === 'addLayerFailed',
        createContentView: () => {
          return new ErrorView({
            title: _t('components.modals.add-layer.add-layer-error')
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
    this.addView(this._footerView);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _onChangeContentView: function () {
    var context = this._createModel.get('contentPane');
    var paneModel = _.first(this._tabPaneCollection.where({ name: context }));
    var paneModelName = paneModel.get('name');
    paneModel.set('selected', true);

    if (paneModelName === 'loading') {
      this._footerView.hide();
    }
    if (paneModelName !== 'listing') {
      this._navigationView.hide();
    }
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
      mapModel
    });
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
      this.mapModel.setSelected(dialogOpts.selectedItems);
      createModel = this.mapModel;
    }

    createModel.bind('datasetCreated', tableMetadata => {
      console.log('dataset created!');
      // let vis;

      // if (router.model.isDatasets()) {
      //   vis = new cdb.admin.Visualization({ type: 'table' });
      //   vis.permission.owner = currentUser;
      //   vis.set('table', tableMetadata.toJSON());
      //   window.location = vis.viewUrl(currentUser).edit();
      // } else {
      //   vis = new cdb.admin.Visualization({ name: DEFAULT_VIS_NAME });
      //   vis.save({
      //     tables: [ tableMetadata.get('id') ]
      //   }, {
      //     success: function (m) {
      //       window.location = vis.viewUrl(currentUser).edit();
      //     },
      //     error: function (e) {
      //       createDialog.close();
      //       collection.trigger('error');
      //     }
      //   });
      // }
    });

    const dialogView = new CreateDialogView({
      modalModel: dialogDependencies.modalModel,
      configModel: this.configModel,
      createModel,
      userModel: this.userModel,
      pollingModel: this.pollingModel
    });

    createModel.viewsReady();

    return dialogView;
  }
});

module.exports = CreateDialogView;
