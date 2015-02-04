var CreateListingView = require('new_common/dialogs/create/create_listing');
var CreateModel = require('new_common/dialogs/create/create_model');
var _ = require('underscore');

describe('new_dashboard/dialog/create/create_listing', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'paco'
    });

    this.model = new CreateModel({
      type: "map",
      option: "preview"
    }, {
      user: this.user
    });

    this.view = new CreateListingView({
      user: this.user,
      createModel: this.model
    });

    this.view.collection.fetch = function() {};

    spyOn(this.view.createModel, 'bind').and.callThrough();
    spyOn(this.view.routerModel, 'bind').and.callThrough();
    
    this.view.render();
  });

  it('should render correctly', function() {
    this.model.set('option', 'listing');
    expect(_.size(this.view._subviews)).toBe(1);
    expect(this.view.$('.ListingNavigation').length).toBe(1);
  });

  it('should fetch collection if option is listing', function() {
    spyOn(this.view, '_fetchCollection');
    this.model.set('option', 'listing');
    this.view.initialize();
    expect(this.view._fetchCollection).toHaveBeenCalled();
  });

  it('should wait for option change for first collection fetching', function() {
    spyOn(this.view, '_fetchCollection');
    this.model.set('option', 'preview');
    expect(this.view._fetchCollection).not.toHaveBeenCalled();
    this.model.set('option', 'listing');
    expect(this.view._fetchCollection).toHaveBeenCalled();
    this.model.set('option', 'preview');
    expect(this.view._fetchCollection.calls.count()).toBe(1);
    this.model.set('option', 'listing');
    expect(this.view._fetchCollection.calls.count()).toBe(1);
  });

  it('should fetch collection when router attributes change', function() {
    var args = this.view.routerModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});


