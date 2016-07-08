var CreateDialogView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_view');
var CreateMapModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('common/dialogs/create/create_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    var createModel = new CreateMapModel({}, {
      user: this.user
    });

    this.view = new CreateDialogView({
      model: createModel,
      user: this.user,
      type: 'map',
      currentUserUrl: this.currentUserUrl
    });

    this.view.render();
  });

  it('should render correctly', function() {
    expect(this.view.$('.CreateDialog-header').length).toBe(1);
    expect(this.view.$('.Dialog-body--create').length).toBe(1);
    expect(this.view.$('.CreateDialog-footer').length).toBe(1);
    expect(this.view.$('.CreateDialog-listing').length).toBe(1);
  });

  it('should have a model included', function() {
    expect(this.view.model).toBeDefined();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
