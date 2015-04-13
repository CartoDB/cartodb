var CreateListingView = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_listing');
var CreateMapModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_map_model');
var _ = require('underscore');

describe('new_dashboard/dialogs/create/create_listing', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });

    this.model = new CreateMapModel({
    }, {
      user: this.user
    });

    this.view = new CreateListingView({
      user: this.user,
      createModel: this.model,
      currentUserUrl: this.currentUserUrl
    });

    spyOn(this.model.collection, 'fetch');
    spyOn(this.model, 'maybePrefetchDatasets');
    spyOn(this.view.createModel, 'bind').and.callThrough();
    spyOn(this.model.routerModel, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function() {
    this.model.set('option', 'listing');
    expect(_.size(this.view._subviews)).toBe(2);
    expect(this.view.$('.Filters--navListing').length).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
