var CreateListingView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_listing');
var CreateMapModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var _ = require('underscore-cdb-v3');

describe('common/dialogs/create/create_listing', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
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
    spyOn(this.view.createModel, 'bind').and.callThrough();
    spyOn(this.model.visFetchModel, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function() {
    this.model.set('option', 'listing');
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
