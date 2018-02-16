var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./add-layer.tpl');
var FooterView = require('./footer/footer-view');
var NavigationView = require('./content/navigation-view');
var ListingView = require('./content/listing-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var ViewFactory = require('builder/components/view-factory');
var renderLoading = require('builder/components/loading/render-loading');
var ErrorView = require('builder/components/error/error-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'modalModel',
  'createModel',
  'configModel',
  'userModel',
  'pollingModel'
];

/**
 * Add layer dialog, typically used from editor
 */
module.exports = CoreView.extend({
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
    var self = this;

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
        createContentView: function () {
          return new ListingView({
            createModel: self._createModel,
            configModel: self._configModel,
            userModel: self._userModel,
            privacyModel: self._privacyModel,
            guessingModel: self._guessingModel
          });
        }
      }, {
        name: 'creatingFromScratch',
        selected: this._createModel.get('contentPane') === 'creatingFromScratch',
        createContentView: function () {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-layer.create-loading-title')
            })
          );
        }
      }, {
        name: 'addingNewLayer',
        selected: this._createModel.get('contentPane') === 'addingNewLayer',
        createContentView: function () {
          return ViewFactory.createByHTML(
            renderLoading({
              title: _t('components.modals.add-layer.adding-new-layer')
            })
          );
        }
      }, {
        name: 'addLayerFailed',
        selected: this._createModel.get('contentPane') === 'addLayerFailed',
        createContentView: function () {
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
      privacyModel: self._privacyModel,
      guessingModel: self._guessingModel

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
});
