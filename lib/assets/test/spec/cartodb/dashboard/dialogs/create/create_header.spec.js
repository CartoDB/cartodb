var CreateHeaderView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_header');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('common/dialogs/create/create_header_view', function() {
  beforeEach(function() {
    cdb.config.set('account_host', 'paco');

    this.user = new cdb.admin.User({
      username: 'paco',
      base_url: 'http://paco.cartdb.com'
    });

    this.model = new CreateModel({
      type: "dataset",
      option: "listing"
    }, {
      user: this.user
    });

    this.view = new CreateHeaderView({
      user: this.user,
      model: this.model
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view.render();
  });

  it('should render correctly', function() {
    expect(this.view.$('.CreateDialog-headerStep').length).toBe(1);
    expect(this.view.$('.CreateDialog-headerStep').hasClass('is-selected')).toBeTruthy();
  });

  it('should render when state attribute changes', function() {
    this.view._initBinds();
    var args = this.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change:option');
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
