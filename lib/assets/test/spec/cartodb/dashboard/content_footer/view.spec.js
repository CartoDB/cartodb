var PaginationModel = require('../../../../../javascripts/cartodb/common/views/pagination/model');
var PaginationView = require('../../../../../javascripts/cartodb/common/views/pagination/view');
var ContentFooterView = require('../../../../../javascripts/cartodb/dashboard/content_footer/view');
var cdb = require('cartodb.js-v3');
var Router = require('../../../../../javascripts/cartodb/dashboard/router');
var $ = require('jquery-cdb-v3');

describe('dashboard/content_footer/view', function() {
  beforeEach(function() {
    var $el = $('<div class="ContentFooter"></div>');

    this.collection = new cdb.admin.Visualizations();
    spyOn(this.collection, 'bind').and.callThrough();

    var dashboardUrl = new cdb.common.DashboardUrl({
      base_url: 'http://paco.carto.com'
    });
    this.router = new Router({
      dashboardUrl: dashboardUrl
    });

    spyOn(this.router.model, 'bind').and.callThrough();

    spyOn(PaginationModel.prototype, 'initialize').and.callThrough();
    spyOn(PaginationModel.prototype, 'set').and.callThrough();

    spyOn(PaginationView.prototype, 'initialize').and.callThrough();
    spyOn(PaginationView.prototype, 'render').and.callThrough();
    spyOn(PaginationView.prototype, 'clean').and.callThrough();

    this.view = new ContentFooterView({
      el:         $el[0],
      collection: this.collection,
      router:     this.router
    });
    spyOn(this.view, 'clearSubViews').and.callThrough();
  });

  it('should listen to change events on router model', function() {
    expect(this.router.model.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  describe('should create a pagination view', function() {
    it('with a pagination model args', function() {
      expect(PaginationView.prototype.initialize).toHaveBeenCalled();

      var createdWith = PaginationView.prototype.initialize.calls.argsFor(0)[0];
      expect(createdWith).toEqual(jasmine.objectContaining({ model:  jasmine.any(Object) }));
      expect(createdWith).toEqual(jasmine.objectContaining({ router: this.router }));
    });

    it('but not render just yet', function() {
      expect(PaginationView.prototype.render).not.toHaveBeenCalled();
    });

    it('which model should be initially configured for routing', function() {
      var viewmodelCreatedWith = PaginationModel.prototype.initialize.calls.argsFor(0)[0];
      expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ current_page: jasmine.any(Number) }));
      expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ url_to:       jasmine.any(Function) }));
    });

    it('which updates on collection changes', function() {
      expect(this.collection.bind).toHaveBeenCalledWith('all', jasmine.any(Function));
    });

    describe('which given a collection change event is triggered', function() {
      beforeEach(function() {
        this.collection.trigger('change');
      });

      it('should update the pagination model accordingly', function() {
        expect(PaginationModel.prototype.set).toHaveBeenCalledWith(jasmine.objectContaining({ per_page:    this.collection.options.get('per_page') }));
        expect(PaginationModel.prototype.set).toHaveBeenCalledWith(jasmine.objectContaining({ total_count: this.collection.total_entries }));
      });
    });

    describe('which given a router model change event is triggered', function() {
      beforeEach(function() {
        // Effectively tests model event listener and re-rendering too
        this.router.model.set('total_count', 0);
      });

      it('should update the pagination model accordingly', function() {
        expect(PaginationModel.prototype.set).toHaveBeenCalledWith('current_page', this.router.model.get('page'));
      });
    });
  });

  describe('.render', function() {
    beforeEach(function() {
      this.view.render();
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should clean subviews on render', function() {
      expect(this.view.clearSubViews).toHaveBeenCalled();
    });

    it('should render pagination view', function() {
      expect(PaginationView.prototype.render).toHaveBeenCalled();
    });

    it('should append the PaginationView to this el', function() {
      expect(this.innerHTML()).toContain('Pagination');
    });

    it('should render an empty lockedvis content by default', function() {
      expect(this.innerHTML()).toContain('filter-shortcut');
    });
  });

  describe('should not request unlocked/locked info when a filter parameter is applied', function() {

    beforeEach(function() {
      spyOn(this.view.filterShortcutVis, 'fetch');
    });

    it('for example shared', function() {
      this.router.model.set('shared', 'only');
      this.collection.reset();
      expect(this.view.filterShortcutVis.fetch).not.toHaveBeenCalled();
      expect(this.view.clearSubViews).toHaveBeenCalled();
    });

    it('for example library', function() {
      this.router.model.set('library', true);
      this.collection.reset([{ a: 'a' }]);
      expect(this.view.filterShortcutVis.fetch).not.toHaveBeenCalled();
      expect(this.view.clearSubViews).toHaveBeenCalled();
    });

    it('for example any search', function() {
      this.router.model.set('q', 'hello');
      this.collection.reset([{ a: 'a' }]);
      expect(this.view.filterShortcutVis.fetch).not.toHaveBeenCalled();
      expect(this.view.clearSubViews).toHaveBeenCalled();
      this.router.model.set({ q: '', tag: 'hello' });
      this.collection.reset();
      expect(this.view.filterShortcutVis.fetch).not.toHaveBeenCalled();
    });

  });

  afterEach(function() {
    this.view.clean();
  });
});
