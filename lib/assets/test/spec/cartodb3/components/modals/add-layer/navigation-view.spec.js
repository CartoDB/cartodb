var CreateModel = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/add-layer-model');
var VisualizationsFetchModel = require('../../../../../../javascripts/cartodb3/data/visualizations-fetch-model');
var TablesCollection = require('../../../../../../javascripts/cartodb3/data/tables-collection');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var NavigationView = require('../../../../../../javascripts/cartodb3/components/modals/add-layer/content/navigation-view');
var _ = require('underscore');

describe('components/modals/add-layer/navigation-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({
      username: 'pepe',
      remaining_byte_quota: 10
    }, {
      configModel: this.configModel
    });

    this.createModel = new CreateModel(
      {},
      {
        visMap: {},
        configModel: this.configModel,
        userModel: this.userModel
      }
    );

    this.visFetchModel = new VisualizationsFetchModel({
      content_type: 'datasets'
    });

    this.tablesCollection = new TablesCollection([], {
      configModel: this.configModel
    });

    this.createView = function () {
      this.view = new NavigationView({
        userModel: this.userModel,
        routerModel: this.visFetchModel,
        createModel: this.createModel,
        tablesCollection: this.tablesCollection
      });
    };
    this.createView();

    this.createModel.set('type', 'dataset');

    spyOn(this.createModel, 'bind').and.callThrough();
    spyOn(this.visFetchModel, 'bind').and.callThrough();
    spyOn(this.tablesCollection, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function () {
    expect(this.view.$('.Filters-searchLink').length).toBe(1);
    expect(this.view.$('.Filters-typeLink').length).toBe(4);
  });

  // TBD: create dataset dialog still not implemented
  // it('should not render several links when create dialog type is dataset', function () {
  //   this.createModel = new CreateDatasetModel({},
  //   {
  //     visMap: {},
  //     configModel: this.configModel,
  //     userModel: this.userModel
  //   });
  //   this.createView();
  //   this.view.render();
  //   expect(this.view.$('.Filters-searchLink').length).toBe(1);
  //   expect(this.view.$('.Filters-typeLink').length).toBe(3);
  // });

  it('should render when listing state changes', function () {
    this.view._initBinds();
    var args = this.createModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change:listing');
  });

  it('should create from scratch when create empty button is clicked', function () {
    spyOn(this.createModel, 'createFromScratch');
    this.view.render();
    this.view.$('.js-create-empty').click();
    expect(this.createModel.createFromScratch).toHaveBeenCalled();
  });

  it('should disable connect-dataset option when user can\'t create more datasets', function () {
    this.createModel.set('listing', 'datasets');
    this.userModel.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-connect').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-connect').click();
    expect(this.createModel.get('listing')).not.toBe('import');
  });

  it('should disable create empty dataset option when user can\'t create more datasets', function () {
    spyOn(this.createModel, 'createFromScratch');
    this.createModel.set('listing', 'datasets');
    this.userModel.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-create-empty').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-create-empty').click();
    expect(this.createModel.createFromScratch).not.toHaveBeenCalled();
  });

  it('should render when router model changes', function () {
    this.view._initBinds();
    var args = this.visFetchModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
  });

  it('should render when collection changes', function () {
    this.view._initBinds();
    var args = this.tablesCollection.bind.calls.argsFor(0);
    expect(args[0]).toEqual('reset');
  });

  it('should search starting for the first page', function () {
    this.visFetchModel.set('page', 2);
    this.view.$('.js-search-input').val('test');
    this.view.$('.js-search-form').submit();
    expect(this.visFetchModel.get('page')).toBe(1);
  });

  it('should change router model and listing model when a link is clicked', function () {
    this.view.render();
    var routerChanged = false;
    var stateChanged = false;

    function resetFlags () {
      routerChanged = false;
      stateChanged = false;
    }

    this.visFetchModel.bind('change', function (m, c) {
      if (!_.isEmpty(m.changed)) routerChanged = true;
    });
    this.createModel.bind('change', function (m, c) {
      if (!_.isEmpty(m.changed)) stateChanged = true;
    });

    resetFlags();

    this.view.$('.js-connect').click();
    expect(routerChanged).toBeFalsy();
    expect(stateChanged).toBeTruthy();

    resetFlags();

    this.view.$('.js-library').click();
    expect(routerChanged).toBeTruthy();
    expect(stateChanged).toBeTruthy();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
