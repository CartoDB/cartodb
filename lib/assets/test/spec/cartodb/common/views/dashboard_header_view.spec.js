var HeaderView = require('../../../../../javascripts/cartodb/common/views/dashboard_header_view');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Backbone = require('backbone-cdb-v3');
var HeaderViewModel = require('../../../../../javascripts/cartodb/profile/header_view_model');
var LocalStorage = require('../../../../../javascripts/cartodb/common/local_storage');

describe('common/views/dashboard_header_view', function() {
  beforeEach(function() {
    // In production is relying on DOM rendered server-side
    this.$el = $('<div>' +
      '<p class="js-logo"></p>' +
      '<li class="js-breadcrumb-dropdown"></li>' +"\n"+
      '<a class="js-settings-dropdown" href="#">User settings dropdown</a>' +"\n"+
      '<div class="Header-settingsItemNotifications js-user-notifications"></div>' +"\n"+
    '</div>');

    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com',
      username: 'pepe',
      account_type: 'FREE',
      id: 123,
      api_key: 'xyz123',
      actions: {
        engine_enabled: true
      }
    });

    this.headerViewModel = new HeaderViewModel();
    spyOn(this.headerViewModel, 'bind');

    this.localStorage = new LocalStorage();

    this.view = new HeaderView({
      el: this.$el,
      model: this.user,
      collection: new Backbone.Collection(),
      viewModel: this.headerViewModel,
      localStorage: this.localStorage
    });
    $(document.body).append(this.view.render().el);
  });

  it('should render breadcrumb links on change events by view model', function() {
    var args = this.headerViewModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view._renderBreadcrumbsDropdownLink);
    expect(args[2]).toEqual(this.view);
  });

  it('should render user notifications', function() {
    this.view.render();
    expect(this.view.el.innerHTML).toContain('UserNotifications');
  });

  describe('.render', function() {
    it('should have no leaks', function() {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should clear sub views', function() {
      var spy = spyOn(this.view, 'clearSubViews');
      this.view.render();

      expect(spy).toHaveBeenCalled();
    });

    it('should render the breadcrumbs dropdown link', function() {
      this.view.render();
      expect(this.innerHTML()).toContain('Datasets');
    });

    it('should render the logo with link', function() {
      this.view.render();
      expect(this.innerHTML()).toMatch('<a class="Logo" href="(.*)/dashboard"');
    });
  });

  describe('.click .js-settings-dropdown', function() {
    beforeEach(function() {
      this.view.render();
      this.killEventSpy = spyOn(this.view, 'killEvent');
      this.addViewSpy = spyOn(this.view, 'addView');
      spyOn(cdb.god, 'trigger');
      this.view.$('.js-settings-dropdown').click();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      expect(this.killEventSpy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      expect(this.addViewSpy).toHaveBeenCalled();
    });

    it('should close any other open dialogs', function() {
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });

  describe('.click .js.breadcrumb-dropdown', function() {
    beforeEach(function() {
      this.view.render();
      this.killEventSpy = spyOn(this.view, 'killEvent');
      this.addViewSpy = spyOn(this.view, 'addView');
      spyOn(cdb.god, 'trigger');
      this.view.$('.js-breadcrumb-dropdown').click();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      expect(this.killEventSpy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      expect(this.addViewSpy).toHaveBeenCalled();
    });

    it('should close any other open dialogs', function() {
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
