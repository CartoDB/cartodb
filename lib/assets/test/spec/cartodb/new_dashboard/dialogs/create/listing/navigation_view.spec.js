var NavigationView = require('../../../../../../../javascripts/cartodb/new_common/dialogs/create/listing/navigation_view');
var CreateMapModel = require('../../../../../../../javascripts/cartodb/new_common/dialogs/create/create_map_model');
var CreateDatasetModel = require('../../../../../../../javascripts/cartodb/new_common/dialogs/create/create_dataset_model');
var RouterModel = require('../../../../../../../javascripts/cartodb/new_dashboard/router/model');
var _ = require('underscore');
var cdb = require('cartodb.js');

describe('new_dashboard/dialogs/create/listing/navigation_view', function() {
  beforeEach(function() {
    cdb.config.set('account_host', 'paco');

    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco',
      remaining_byte_quota: 10
    });

    this.createModel = new CreateMapModel({
    }, {
      user: this.user
    });

    this.routerModel = new RouterModel({
      content_type: 'datasets'
    }, {
      dashboardUrl: this.user.viewUrl().dashboard()
    });

    this.collection = new cdb.admin.Visualizations();
    this.collection.fetch = function() {};

    this.createView = function() {
      this.view = new NavigationView({
        user: this.user,
        routerModel: this.routerModel,
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
    expect(this.view.$('.Filters-typeLink').length).toBe(5);
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

  it('should disable connect-dataset option when user can\'t create more datasets', function() {
    this.view.createModel.set('listing', 'datasets');
    this.user.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-connect').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-connect').click();
    expect(this.view.createModel.get('listing')).not.toBe('import');
  });

  it('should disable create empty dataset option when user can\'t create more datasets', function() {
    this.view.createModel.set('listing', 'datasets');
    this.user.set('remaining_byte_quota', 0);
    this.view.render();
    expect(this.view.$('.js-create_empty').hasClass('is-disabled')).toBeTruthy();
    this.view.$('.js-create_empty').click();
    expect(this.view.createModel.get('listing')).not.toBe('scratch');
  });

  it('should render when router model changes', function() {
    this.view._initBinds();
    var args = this.routerModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
  });

  it('should render when collection changes', function() {
    this.view._initBinds();
    var args = this.collection.bind.calls.argsFor(0);
    expect(args[0]).toEqual('reset');
  });

  it('should change router model and listing model when a link is clicked', function() {
    var routerChanged = false;
    var stateChanged = false;

    function resetFlags () {
      routerChanged = false;
      stateChanged = false;
    }

    this.routerModel.bind('change', function(m, c) {
      if (!_.isEmpty(c.changes)) routerChanged = true;
    });
    this.createModel.bind('change', function(m, c) {
      if (!_.isEmpty(c.changes)) stateChanged = true;
    });
    this.view.$('.js-liked').click();
    expect(routerChanged).toBeTruthy();
    expect(stateChanged).toBeFalsy();

    resetFlags();

    this.view.$('.js-connect').click();
    expect(routerChanged).toBeFalsy();
    expect(stateChanged).toBeTruthy();

    resetFlags();

    this.view.$('.js-library').click();
    expect(routerChanged).toBeTruthy();
    expect(stateChanged).toBeTruthy();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
