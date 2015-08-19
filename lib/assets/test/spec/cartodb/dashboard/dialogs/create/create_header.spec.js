var CreateHeaderView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_header');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');

describe('dashboard/dialogs/create/create_header_view', function() {
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

  describe("type dataset", function() {

    it('should render correctly', function() {
      expect(this.view.$('.CreateDialog-headerStep').length).toBe(1);
      expect(this.view.$('.CreateDialog-headerStep').hasClass('is-selected')).toBeTruthy();
    });

  });

  describe("type map", function() {

    beforeEach(function() {
      this.model.set({
        type: 'map'
      });
    });

    it('should render correctly', function() {
      expect(this.view.$('.CreateDialog-headerStep').length).toBe(2);
      expect(this.view.$('.CreateDialog-headerStep:eq(0)').find('.Dialog-headerIconBadge').length).toBe(0);
      expect(this.view.$('.CreateDialog-headerStep:eq(0)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.CreateDialog-headerButton').length).toBe(0);
    });

    it('should render correctly when option is listing', function() {
      this.model.set('option', 'listing');
      expect(this.view.$('.CreateDialog-headerStep:eq(1)').hasClass('is-selected')).toBeTruthy();
      expect(this.view.$('.CreateDialog-headerStep:eq(0)').find('.Dialog-headerIconBadge').length).toBe(0);
      expect(this.view.$('.CreateDialog-headerStep:eq(0)').length).toBe(1);
      expect(this.view.$('.CreateDialog-headerButton').length).toBe(1);
    });

  });

  it('should render when option attribute changes', function() {
    this.view._initBinds();
    var args = this.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change:option');
  });

  it('should change router option when back button is clicked', function() {
    this.model.set({
      type: 'map'
    });
    this.view.$('.js-back').click();
    expect(this.model.get('option')).toBe('templates');
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
