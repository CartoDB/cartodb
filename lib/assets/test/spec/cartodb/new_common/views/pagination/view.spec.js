var PaginationModel = require('../../../../../../javascripts/cartodb/new_common/views/pagination/model');
var PaginationView = require('../../../../../../javascripts/cartodb/new_common/views/pagination/view');
var Router = require('../../../../../../javascripts/cartodb/new_common/router.js');
var UserUrl = require('../../../../../../javascripts/cartodb/new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe('new_common/views/pagination/view', function() {
  beforeEach(function() {
    this.model = new PaginationModel({
      total_count:  9000,
      per_page:     50,
      current_page: 42,
      url_to:       function(page) { return '/url/to/page/' + page; }
    });
    spyOn(this.model, 'bind').and.callThrough();

    this.user = new cdbAdmin.User({
      username: 'pepe'
    });
    this.router = new Router({
      currentUserUrl: new UserUrl({
        account_host: 'cartodb.com',
        user: this.user
      })
    });
    spyOn(this.router, 'navigate');

    this.view = new PaginationView({
      model:  this.model,
      router: this.router
    });

    this.view.render();
    this.html = this.view.el.innerHTML;
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render current page and the total count', function() {
    expect(this.html).toContain('Page 42 of 180');
  });

  it('should render URLs by provided url_to function', function() {
    expect(this.html).toContain('/url/to/page/40'); //first
    expect(this.html).toContain('/url/to/page/44'); //last
  });

  it('should re-render on model change', function() {
    expect(this.model.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  describe('given there are no items', function() {
    beforeEach(function() {
      // Effectively tests model event listener and re-rendering too
      this.model.set({
        total_count:  0,
        current_page: 1
      });
      this.html = this.view.el.innerHTML;
    });

    it('should not render pagination items at all', function() {
      expect(this.html).not.toContain('Page ');
      expect(this.html).not.toContain('Pagination-label');
      expect(this.html).not.toContain('Pagination-list');
    });
  });

  describe('given there is only one page', function() {
    beforeEach(function() {
      this.model.set({
        total_count:  this.model.get('per_page'),
        current_page: 1
      });

      this.html = this.view.el.innerHTML;
    });

    it('should not render pagination label', function() {
      expect(this.html).not.toContain('Page 1 of 1');
    });

    it('should not render pagination list', function() {
      expect(this.html).not.toContain('Pagination-list');
    });
  });

  describe('given current page is larger than available page', function() {
    beforeEach(function() {
      this.model.set({
        total_count: this.model.get('per_page'),
        current_page: 9000
      });

      this.html = this.view.el.innerHTML;
    });

    it('should not render pagination list', function() {
      expect(this.html).not.toContain('Pagination-list');
    });
  });


  describe('click a link', function() {
    beforeEach(function() {
      this.view.$('a').click();
    });

    it('should navigate through router', function() {
      expect(this.router.navigate).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
