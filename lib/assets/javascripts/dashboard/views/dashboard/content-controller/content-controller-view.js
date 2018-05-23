const $ = require('jquery');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const FiltersView = require('dashboard/views/dashboard/filters/filters-view');
const ListView = require('dashboard/components/list-view/list-view');
const ContentResult = require('dashboard/views/dashboard/content-controller/content-result-view');
const OnboardingView = require('dashboard/views/dashboard/onboarding/onboarding-view');
const ContentFooterView = require('dashboard/views/dashboard/content-controller/content-footer/content-footer-view');
const LoadingLibraryView = require('dashboard/views/dashboard/content-controller/loading-library-view');
const CreateDialog = require('dashboard/views/dashboard/dialogs/create-dialog/sacar-fuera/dialog-view');
const template = require('./content-controller.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'routerModel',
  'localStorage',
  'backgroundPollingView'
];

module.exports = CoreView.extend({
  className: 'ContentController',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._modals = new ModalsServiceModel();
    this._initBindings();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();

    return this;
  },

  _initBindings: function () {
    this.listenTo(this._routerModel.model, 'change', this._onRouterChange);

    this.listenTo(this.collection, 'reset sync', this._onDataFetched);
    this.listenTo(this.collection, 'loading', this._onDataLoading);
    this.listenTo(this.collection, 'add', this._onDataChange);
    this.listenTo(this.collection, 'error', function (collection, error, options) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!error || (error && error.statusText !== 'abort')) {
        this._onDataError();
      }
    });

    // Binding window scroll :(
    document.addEventListener('scroll', this._onWindowScroll);
  },

  _initViews: function () {
    this.controlledViews = {}; // All available views
    this.enabledViews = []; // Visible views

    const onboardingView = new OnboardingView({
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals
    });
    this.controlledViews['onboarding'] = onboardingView;
    this.$el.prepend(onboardingView.render().el);
    this.addView(onboardingView);

    const filtersView = new FiltersView({
      el: this.$('.Filters'),
      configModel: this._configModel,
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      localStorage: this._localStorage,
      modals: this._modals,
      headerHeight: this.options.headerHeight
    });

    this.listenTo(filtersView, 'importByUploadData', this._backgroundPollingView._addDataset.bind(this._backgroundPollingView));

    this.controlledViews['filters'] = filtersView;
    filtersView.render();
    this.addView(filtersView);

    const noDatasetsView = new ContentResult({
      className: 'ContentResult no-datasets',
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      template: require('./templates/content-no-datasets.tpl')
    });

    noDatasetsView.bind('connectDataset', function () {
      if (this._userModel && this._userModel.canCreateDatasets()) {
        this._modals.create(modalModel => {
          return CreateDialog.openDialog({ modalModel }, {
            type: 'dataset',
            selectedItems: [],
            modalModel
          });
        });
      }
    }, this);

    this.controlledViews['no_datasets'] = noDatasetsView;
    this.$('.NoDatasets').append(noDatasetsView.render().el);
    this.addView(noDatasetsView);

    const listView = new ListView({
      userModel: this._userModel,
      routerModel: this._routerModel,
      configModel: this._configModel,
      modals: this._modals,
      collection: this.collection
    });

    this.controlledViews['list'] = listView;
    this.$('#content-list').append(listView.render().el);
    this.addView(listView);

    const noResultsView = new ContentResult({
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      template: require('./templates/content-no-results.tpl')
    });

    this.controlledViews['no_results'] = noResultsView;
    this.$el.append(noResultsView.render().el);
    this.addView(noResultsView);

    const loadingLibrary = new LoadingLibraryView();
    this.controlledViews['loading_library'] = loadingLibrary;
    this.$el.append(loadingLibrary.render().el);
    this.addView(loadingLibrary);

    const errorView = new ContentResult({
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      template: require('./templates/content-error.tpl')
    });

    this.controlledViews['error'] = errorView;
    this.$el.append(errorView.render().el);
    this.addView(errorView);

    const mainLoaderView = new ContentResult({
      userModel: this._userModel,
      routerModel: this._routerModel,
      collection: this.collection,
      template: require('./templates/content-loader.tpl')
    });

    this.controlledViews['main_loader'] = mainLoaderView;
    this.$el.append(mainLoaderView.render().el);
    this.addView(mainLoaderView);

    // // No need to call render, will render itself upon initial collection fetch
    const contentFooter = new ContentFooterView({
      el: this.$('#content-footer'),
      configModel: this._configModel,
      router: this._routerModel,
      collection: this.collection
    });

    this.controlledViews['content_footer'] = contentFooter;
    // Move element to end of the parent, if not paginator will appear
    // before other elements
    this.$('#content-footer').appendTo(this.$el);
    this.addView(contentFooter);
  },

  _onRouterChange: function (model, value) {
    let blocks = [];

    if (value && value.changes && value.changes.content_type) {
      // If it changes to a different type (or tables or visualizations)
      // Show the main loader
      blocks = [ 'filters', 'main_loader' ];
    } else {
      blocks = ['filters'];

      if (this._isBlockEnabled('list') && this.collection.total_user_entries > 0) {
        // If list was enabled, keep it visible
        blocks.push('list', 'content_footer');
      } else {
        blocks.push('main_loader');
      }

      // If no_results was enabled, keep it visible
      if (this._isBlockEnabled('no_results') || this._isBlockEnabled('error')) {
        if (!_.contains(blocks, 'main_loader')) {
          blocks.push('main_loader');
        }
      }
    }

    this._hideBlocks();
    this._showBlocks(blocks);
    this._scrollToTop();
  },

  _onDataLoading: function () {
    this.$el.removeClass('on-boarding');
  },

  /**
   * Arguments may consty, depending on if it's the collection or a model that triggers the event callback.
   * @private
   */
  _onDataFetched: function () {
    let activeViews = [ 'filters', 'content_footer' ];
    const tag = this._routerModel.model.get('tag');
    const q = this._routerModel.model.get('q');
    const shared = this._routerModel.model.get('shared');
    const liked = this._routerModel.model.get('liked');
    const locked = this._routerModel.model.get('locked');
    const library = this._routerModel.model.get('library');

    if (library && this.collection.total_user_entries === 0) {
      activeViews.push('no_datasets');
    }

    if (this.collection.size() === 0) {
      if (!tag && !q && shared === 'no' && !locked && !liked) {
        if (this._routerModel.model.get('content_type') === 'maps') {
          this.$el.addClass('on-boarding');
          activeViews = ['onboarding', 'filters'];
        } else if (library) {
          // Library is loaded async on 1st visit by user, so this code path is only reached until the library has been
          // stocked up. Show an intermediate loading info, and retry fetching data until while user stays here.
          // See https://github.com/CartoDB/cartodb/pull/2741 for more details.
          activeViews.push('loading_library');
          this.controlledViews['loading_library'].retrySoonAgainOrAbortIfLeavingLibrary(this.collection, this._routerModel.model);
        } else {
          activeViews.push('no_results');
        }
      } else {
        activeViews.push('no_results');
      }
    } else {
      activeViews.push('list');
    }

    this._hideBlocks();
    this._showBlocks(activeViews);
  },

  _onDataChange: function () {
    // Fetch collection again to check if current
    // view has suffered a change
    this.collection.fetch();
  },

  _onDataError: function (e) {
    this._hideBlocks();
    this._showBlocks([ 'filters', 'error' ]);
  },

  _showBlocks: function (views) {
    if (views) {
      _.each(views, function (view) {
        this.controlledViews[view].show();
        this.enabledViews.push(view);
      }, this);
    } else {
      this.enabledViews = [];

      _.each(this.controlledViews, function (view) {
        view.show();
        this.enabledViews.push(view);
      }, this);
    }
  },

  _hideBlocks: function (views) {
    if (views) {
      _.each(views, function (view) {
        this.controlledViews[view].hide();
        this.enabledViews = _.without(this.enabledViews, view);
      }, this);
    } else {
      _.each(this.controlledViews, function (view) {
        view.hide();
      }, this);

      this.enabledViews = [];
    }
  },

  _isBlockEnabled: function (name) {
    if (name) {
      return _.contains(this.enabledViews, name);
    }

    return false;
  },

  _scrollToTop: function () {
    $('body').animate({ scrollTop: 0 }, 550);
  }
});
