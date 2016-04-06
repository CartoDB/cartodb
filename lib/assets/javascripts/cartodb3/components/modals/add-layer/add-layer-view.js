var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var template = require('./add-layer.tpl');
var FooterView = require('./footer/footer-view');
var NavigationView = require('./content/navigation-view');
var ListingView = require('./content/listing-view');
var TabPaneView = require('../../tab-pane/tab-pane-view');
var TabPaneCollection = require('../../tab-pane/tab-pane-collection');
var ViewFactory = require('../../view-factory');
var renderLoading = require('../../loading/render-loading');
var ErrorView = require('../../error/error-view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = cdb.core.View.extend({

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new TypeError('model is required');
    if (!opts.createModel) throw new TypeError('createModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._modalModel = opts.modalModel;
    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initBinds: function () {
    this._createModel.bind('addLayerDone', this._modalModel.hide.bind(this._modalModel), this);
    this._createModel.bind('change:contentPane', this._onChangeContentView, this);
    cdb.god.bind('importByUploadData', this._modalModel.hide.bind(this._modalModel), this);
    this.add_related_model(this._createModel);
  },

  _initViews: function () {
    var self = this;

    this._navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      userModel: this._userModel,
      routerModel: this._createModel.getVisualizationFetchModel(),
      createModel: this._createModel,
      tablesCollection: this._createModel.getTablesCollection()
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
            userModel: self._userModel
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
      createModel: this._createModel,
      userModel: this._userModel
    });
    this.addView(this._footerView);
    this.$('.js-footer').append(this._footerView.render().el);
  },

  _onChangeContentView: function () {
    var context = this._createModel.get('contentPane');
    var paneModel = _.first(this._tabPaneCollection.where({ name: context }));
    paneModel.set('selected', true);
    var paneModelName = paneModel.get('name');
    if (paneModelName === 'loading') {
      this._footerView.hide();
    }
    if (paneModelName !== 'listing') {
      this._navigationView.hide();
    }
  }
});
