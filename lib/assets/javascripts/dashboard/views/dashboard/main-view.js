const $ = require('jquery');
const CoreView = require('backbone/core-view');
const LocalStorage = require('dashboard/helpers/local-storage');
const HeaderView = require('dashboard/components/private-header-view');
const SupportView = require('dashboard/components/support-view');
const FooterView = require('dashboard/components/footer/footer-view');

const MamufasImportView = require('dashboard/components/mamufas-import/mamufas-import-view');
const ContentControllerView = require('dashboard/views/dashboard/content-controller/content-controller-view');
const HeaderViewModel = require('dashboard/views/dashboard/header-view-model');
const UpgradeMessage = require('dashboard/components/upgrade-message-view');
const VendorScriptsView = require('dashboard/components/vendor-scripts/vendor-scripts-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'routerModel',
  'backgroundPollingModel',
  'backgroundPollingView'
];

module.exports = CoreView.extend({
  events: {
    'click': '_onClick'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initModels();
    this._initViews();
    this._initBindings();
  },

  _initBindings: function () {
    this.listenTo(this._routerModel.model, 'change', this._onRouterChange);
  },

  _initModels: function () {
    this.localStorage = new LocalStorage();

    // Update order and category attribute to router model
    this._routerModel.model.set('order', this.localStorage.get('dashboard.order'), { silent: true });
    this._routerModel.model.set('category', this.localStorage.get('dashboard.category'), { silent: true });
  },

  _onRouterChange: function (model, value) {
    this._fetchCollection(model, value);

    // Only create a visualization from an import if user is in maps section
    this._backgroundPollingView.createVis = this._routerModel.model.isMaps();
  },

  _fetchCollection: function (model, value) {
    const params = this._routerModel.model.attributes;

    // Get order from localStorage if it is not defined or
    // come from other type (tables or visualizations)
    let order = this.localStorage.get('dashboard.order') || 'updated_at';

    // Maps doesn't have size order, so if that order is set
    // in maps section we will show with 'updated_at' order
    if (params.content_type === 'maps' && order === 'size') {
      order = 'updated_at';
    }

    let types = params.content_type === 'datasets' ? 'table' : 'derived';

    // Requesting data library items?
    if (params.library) {
      types = 'remote';
    }

    // Supporting search in data library and user datasets at the same time
    if ((params.q || params.tag) && params.content_type === 'datasets') {
      types = 'table,remote';
    }

    // TODO: review, should collection params really be set here?
    this.collection.options.set({
      q: params.q,
      page: params.page || 1,
      tags: params.tag,
      per_page: this.collection['_' + (params.content_type === 'datasets' ? 'TABLES' : 'ITEMS') + '_PER_PAGE'],
      shared: params.shared,
      locked: params.liked ? '' : params.locked, // If not locked liked items are not rendered
      only_liked: params.liked,
      order,
      types,
      type: '',
      deepInsights: !!params.deepInsights
    });

    this.collection.fetch();
  },

  _initViews: function () {
    // I didn't see where this event was triggered in background polling model
    this._backgroundPollingModel.bind('importCompleted', function () {
      this.collection.fetch();
      this._userModel.fetch();
    }, this);

    this.$el.append(this._backgroundPollingView.render().el);
    this.addView(this._backgroundPollingView);

    const mamufasView = new MamufasImportView({
      el: this.$el,
      userModel: this._userModel
    });
    this.addView(mamufasView);

    mamufasView.on('dialogOpened', () => {
      this._backgroundPollingModel.stopPollings();
    });
    mamufasView.on('dialogClosed', () => {
      this._backgroundPollingModel.startPollings();
    });

    mamufasView.on('fileDropped', files => {
      this._backgroundPollingView._onDroppedFile(files);
    });

    mamufasView.render();
    mamufasView.enable();

    const headerView = new HeaderView({
      model: this._userModel,
      configModel: this._configModel,
      viewModel: new HeaderViewModel(this._routerModel),
      router: this._routerModel,
      collection: this.collection,
      localStorage: this.localStorage,
      breadcrumbsDropdownOffset: -110
    });
    this.$('#app').prepend(headerView.render().el);
    this.addView(headerView);

    const controllerView = new ContentControllerView({
      // Pass the whole element for only calculating
      // the height is not 'fair'
      headerHeight: this.$('#header').height(),
      configModel: this._configModel,
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      localStorage: this.localStorage,
      backgroundPollingView: this._backgroundPollingView
    });
    this.$('#app').append(controllerView.render().el);
    this.addView(controllerView);

    if (!this._configModel.get('cartodb_com_hosted')) {
      const supportView = new SupportView({
        userModel: this._userModel
      });
      this.$('#app').append(supportView.render().el);
      this.addView(supportView);
    }

    const upgradeMessage = new UpgradeMessage({
      userModel: this._userModel,
      configModel: this._configModel
    });

    this.$('.Header').after(upgradeMessage.render().el);
    this.addView(upgradeMessage);

    const footerView = new FooterView({ configModel: this._configModel });
    this.$('#app').append(footerView.render().el);
    this.addView(footerView);

    const vendorScriptsView = new VendorScriptsView({
      configModel: this._configModel,
      assetsVersion: this.options.assetsVersion,
      userModel: this._userModel
    });
    this.$el.append(vendorScriptsView.render().el);
    this.addView(vendorScriptsView);
  },

  _onClick: function (event) {
    // Clicks outside of any dialog 'body' will fire a closeDialogs event
    if (this._isEventTriggeredOutsideOf(event, '.Dialog')) {
      // cdb.god.trigger('closeDialogs');

      // If click outside the filters view should also unselect any selected items
      if (this._isEventTriggeredOutsideOf(event, '.js-skip-unselect-all')) {
        // cdb.god.trigger('unselectAllItems');
      }
    }
  },

  _isEventTriggeredOutsideOf: function (event, selector) {
    return $(event.target).closest(selector).length === 0;
  }
});
