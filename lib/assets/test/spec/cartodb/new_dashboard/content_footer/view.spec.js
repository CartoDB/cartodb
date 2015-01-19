var ContentFooterView = require('new_dashboard/content_footer/view');
var cdb = require('cartodb.js');
var Router = require('new_dashboard/router');

describe('new_dashboard/content_footer/view', function() {
  beforeEach(function() {
    $el = $('<div class="ContentFooter"></div>');

    this.collection = new cdb.admin.Visualizations();
    spyOn(this.collection, 'bind').and.callThrough();

    this.router = new Router({
    });

    spyOn(this.router.model, 'bind').and.callThrough();

    this.paginationModelStub = jasmine.createSpyObj('paginationModel', ['render', 'clean', 'set']);
    this.PaginationModelSpy = jasmine.createSpy('PaginationModel');
    this.PaginationModelSpy.and.returnValue(this.paginationModelStub);
    ContentFooterView.__set__('PaginationModel', this.PaginationModelSpy);

    this.paginationViewStub = jasmine.createSpyObj('paginationView', ['render', 'clean']);
    this.paginationViewStub.el = $('<div class="Pagination"></div>')[0];
    this.PaginationViewSpy = jasmine.createSpy('PaginationView');
    this.PaginationViewSpy.and.returnValue(this.paginationViewStub);
    ContentFooterView.__set__('PaginationView', this.PaginationViewSpy);

    this.view = new ContentFooterView({
      el:         $el[0],
      collection: this.collection,
      router:     this.router
    });
    spyOn(this.view, 'clearSubViews');
  });

  it('should listen to change events on router model', function() {
    expect(this.router.model.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  describe('should create a pagination view', function() {
    it('with a pagination model args', function() {
      expect(this.PaginationViewSpy).toHaveBeenCalled();

      var createdWith = this.PaginationViewSpy.calls.argsFor(0)[0];
      expect(createdWith).toEqual(jasmine.objectContaining({ model:  this.paginationModelStub }));
      expect(createdWith).toEqual(jasmine.objectContaining({ router: this.router }));
    });

    it('but not render just yet', function() {
      expect(this.paginationViewStub.render).not.toHaveBeenCalled();
    });

    it('which model should be initially configured for routing', function() {
      var viewmodelCreatedWith = this.PaginationModelSpy.calls.argsFor(0)[0];
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
        expect(this.paginationModelStub.set).toHaveBeenCalledWith(jasmine.objectContaining({ per_page:    this.collection.options.get('per_page') }));
        expect(this.paginationModelStub.set).toHaveBeenCalledWith(jasmine.objectContaining({ total_count: this.collection.total_entries }));
      });
    });

    describe('which given a router model change event is triggered', function() {
      beforeEach(function() {
        // Effectively tests model event listener and re-rendering too
        this.router.model.set('total_count', 0);
      });

      it('should update the pagination model accordingly', function() {
        expect(this.paginationModelStub.set).toHaveBeenCalledWith('current_page', this.router.model.get('page'));
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
      expect(this.paginationViewStub.render).toHaveBeenCalled();
    });

    it('should append the PaginationView to this el', function() {
      expect(this.innerHTML()).toContain('Pagination');
    });

    it('should render an empty lockedvis content by default', function() {
      expect(this.innerHTML()).toContain('filter-shortcut');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
