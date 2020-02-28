var Backbone = require('backbone');
var CreateModel = require('builder/components/modals/add-layer/add-layer-model');
var VisualizationsFetchModel = require('builder/data/visualizations-fetch-model');
var TablesCollection = require('builder/data/tables-collection');
var UserModel = require('builder/data/user-model');
var ConfigModel = require('builder/data/config-model');
var NavigationView = require('builder/components/modals/add-layer/content/navigation-view');
var _ = require('underscore');

describe('components/modals/add-layer/navigation-view', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/viz\?.*'))
      .andReturn({ status: 200 });

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
        configModel: this.configModel,
        userModel: this.userModel,
        userActions: {},
        pollingModel: new Backbone.Model()
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
        configModel: this.configModel,
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

  afterEach(function () {
    jasmine.Ajax.uninstall();
    this.view.remove();
  });

  it('should render correctly', function () {
    expect(this.view.$('.Filters-searchLink').length).toBe(1);
    expect(this.view.$('.js-typeItem').length).toBe(4);
  });

  // TBD: create dataset dialog still not implemented
  // it('should not render several links when create dialog type is dataset', function () {
  //   this.createModel = new CreateDatasetModel({},
  //   {js-typeItem
  //     visMap: {},
  //     configModel: this.configModel,
  //     userModel: this.userModel
  //   });
  //   this.createView();
  //   this.view.render();
  //   expect(this.view.$('.Filters-searchLink').length).toBe(1);
  //   expect(this.view.$('.Filters-typeLink').length).toBe(3);
  // });

  describe('when data library is enabled', function () {
    describe('.render', function () {
      it('should render correctly', function () {
        spyOn(this.view._configModel, 'dataLibraryEnabled').and.returnValue(true);
        this.view.render();

        expect(this.view.$('.js-typeItem').length).toBe(5);
        expect(this.innerHTML()).toContain('components.modals.add-layer.navigation.data-library');
      });
    });
  });

  describe('.initBinds', function () {
    it('should render when listing state changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();

      this.createModel.trigger('change:listing');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should render when router model changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();

      this.visFetchModel.trigger('change');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should render when collection changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();

      this.tablesCollection.trigger('sync');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call _onChangeIsSearchEnabled when model isSearchEnabled changes', function () {
      spyOn(this.view, '_onChangeIsSearchEnabled');
      this.view._initBinds();

      this.view.model.trigger('change:isSearchEnabled');
      expect(this.view._onChangeIsSearchEnabled).toHaveBeenCalled();
    });
  });

  it('should create from scratch when create empty button is clicked', function () {
    spyOn(this.createModel, 'createFromScratch');
    this.userModel.set('account_type', 'ACCOUNT');
    this.view.render();
    this.view.$('.js-create-empty').click();
    expect(this.createModel.createFromScratch).toHaveBeenCalled();
  });

  it('should disable connect-dataset option when user is out of bytes quota', function () {
    this.createModel.set('listing', 'datasets');
    this.userModel.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-connect').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-connect').click();
    expect(this.createModel.get('listing')).not.toBe('import');
  });

  it('should disable connect-dataset option when user Individual and is out of datasets quota', function () {
    this.createModel.set('listing', 'datasets');
    this.userModel.set('account_type', 'Individual');
    this.userModel.set('table_quota', 40);
    this.userModel.set('table_count', 40);
    this.view.render();
    expect(this.view.$('.js-connect').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-connect').click();
    expect(this.createModel.get('listing')).not.toBe('import');
  });

  it('should disable create empty dataset option when user is out of bytes quota', function () {
    spyOn(this.createModel, 'createFromScratch');
    this.createModel.set('listing', 'datasets');
    this.userModel.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-create-empty').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-create-empty').click();
    expect(this.createModel.createFromScratch).not.toHaveBeenCalled();
  });

  it('should disable create empty dataset option when user Individual and is out of datasets quota', function () {
    spyOn(this.createModel, 'createFromScratch');
    this.createModel.set('listing', 'datasets');
    this.userModel.set('account_type', 'Individual');
    this.userModel.set('table_quota', 40);
    this.userModel.set('table_count', 40);
    this.view.render();
    expect(this.view.$('.js-create-empty').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-create-empty').click();
    expect(this.createModel.createFromScratch).not.toHaveBeenCalled();
  });

  it('should search starting for the first page', function () {
    this.visFetchModel.set('page', 2);
    this.view.$('.js-search-input').val('test');
    this.view.$('.js-search-form').submit();
    expect(this.visFetchModel.get('page')).toBe(1);
  });

  it('should change router model and listing model when a link is clicked', function () {
    spyOn(this.view._configModel, 'dataLibraryEnabled').and.returnValue(true);
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
});
