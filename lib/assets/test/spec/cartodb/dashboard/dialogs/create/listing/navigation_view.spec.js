var NavigationView = require('../../../../../../../javascripts/cartodb/common/dialogs/create/listing/navigation_view');
var CreateMapModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var CreateDatasetModel = require('../../../../../../../javascripts/cartodb/common/dialogs/create/create_dataset_model');
var VisFetchModel = require('../../../../../../../javascripts/cartodb/common/visualizations_fetch_model');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');

describe('common/dialogs/create/listing/navigation_view', function() {
  beforeEach(function() {
    cdb.config.set('data_library_enabled', true);
    cdb.config.set('account_host', 'paco');

    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco',
      remaining_byte_quota: 10
    });

    this.createModel = new CreateMapModel({
    }, {
      user: this.user
    });

    this.visFetchModel = new VisFetchModel({
      content_type: 'datasets'
    });

    this.collection = new cdb.admin.Visualizations();
    this.collection.fetch = function() {};

    this.createView = function() {
      this.view = new NavigationView({
        user: this.user,
        routerModel: this.visFetchModel,
        createModel: this.createModel,
        collection: this.collection
      });
    };
    this.createView();

    this.createModel.set('type', 'dataset');

    spyOn(this.createModel, 'bind').and.callThrough();
    spyOn(this.view.routerModel, 'bind').and.callThrough();
    spyOn(this.view.collection, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function() {
    expect(this.view.$('.Filters-searchLink').length).toBe(1);
    expect(this.view.$('.Filters-typeLink').length).toBe(4);
  });

  it('should not render several links when create dialog type is dataset', function() {
    this.createModel = new CreateDatasetModel({
    }, {
      user: this.user
    });
    this.createView();
    this.view.render();
    expect(this.view.$('.Filters-searchLink').length).toBe(1);
    expect(this.view.$('.Filters-typeLink').length).toBe(3);
  });

  it('should render when listing state changes', function() {
    this.view._initBinds();
    var args = this.createModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change:listing');
  });

  it('should create from scratch when create empty button is clicked', function() {
    spyOn(this.view.createModel, 'createFromScratch');
    this.view.render();
    this.view.$('.js-create_empty').click();
    expect(this.view.createModel.createFromScratch).toHaveBeenCalled();
  });

  it('should disable connect-dataset option when user can\'t create more datasets', function() {
    this.view.createModel.set('listing', 'datasets');
    this.user.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-connect').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-connect').click();
    expect(this.view.createModel.get('listing')).not.toBe('import');
  });

  it('should disable create empty dataset option when user can\'t create more datasets', function() {
    spyOn(this.view.createModel, 'createFromScratch');
    this.view.createModel.set('listing', 'datasets');
    this.user.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-create_empty').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-create_empty').click();
    expect(this.view.createModel.createFromScratch).not.toHaveBeenCalled();
  });

  it('should render when router model changes', function() {
    this.view._initBinds();
    var args = this.visFetchModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
  });

  it('should render when collection changes', function() {
    this.view._initBinds();
    var args = this.collection.bind.calls.argsFor(0);
    expect(args[0]).toEqual('reset');
  });

  it('should search starting for the first page', function() {
    this.visFetchModel.set('page', 2);
    this.view.$('.js-search-input').val('test');
    this.view.$('.js-search-form').submit();
    expect(this.visFetchModel.get('page')).toBe(1);
  });

  it('should change router model and listing model when a link is clicked', function() {
    var routerChanged = false;
    var stateChanged = false;

    function resetFlags () {
      routerChanged = false;
      stateChanged = false;
    }

    this.visFetchModel.bind('change', function(m, c) {
      if (!_.isEmpty(c.changes)) routerChanged = true;
    });
    this.createModel.bind('change', function(m, c) {
      if (!_.isEmpty(c.changes)) stateChanged = true;
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

  describe('when createMode _onDatasetsClick is true', function () {
    describe('.render', function () {
      it('should render properly', function () {
        expect(_.size(this.view._subviews)).toBe(0);
        spyOn(this.view, '_datasetsTabDisabled').and.returnValue(true);

        this.view.render();

        expect(_.size(this.view._subviews)).toBe(1);
      });
    });

    describe('._onDatasetsClick', function () {
      it('should return immediatly', function () {
        spyOn(this.createModel, 'set')
        spyOn(this.visFetchModel, 'set')
        spyOn(this.view, '_datasetsTabDisabled').and.returnValue(true);

        this.view.render();
        this.view._onDatasetsClick();

        expect(this.createModel.set).not.toHaveBeenCalled();
        expect(this.visFetchModel.set).not.toHaveBeenCalled();
      });
    })
  }),

  describe('._onDatasetsClick', function () {
    it('should call set in routerModel and createModel', function () {
      spyOn(this.createModel, 'set')
      spyOn(this.visFetchModel, 'set')
      spyOn(this.view, '_datasetsTabDisabled').and.returnValue(false);

      this.view.render();
      this.view._onDatasetsClick();

      expect(this.createModel.set).toHaveBeenCalled();
      expect(this.visFetchModel.set).toHaveBeenCalled();
    });
  }),

  describe('._datasetsTabDisabled', function () {
    it('should return the value of createModel datasetTabDisabled', function () {
      expect(this.view._datasetsTabDisabled()).toBeFalsy();
      this.createModel.set('datasetsTabDisabled', true);
      expect(this.view._datasetsTabDisabled()).toBe(true);
    });
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
