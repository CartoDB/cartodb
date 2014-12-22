var ContentFooterView = require('new_dashboard/content_footer/view');
var cdb = require('cartodb.js');
var Router = require('new_dashboard/router');

describe('new_dashboard/content_footer/view', function() {
  beforeEach(function() {
    $el = $('<div class="ContentFooter"></div>');

    this.collection = new cdb.admin.Visualizations();

    this.router = new Router({
      rootUrl: ''
    });

    spyOn(this.router.model, 'bind');

    this.paginationModelStub = jasmine.createSpyObj('paginationModel', ['render', 'clean']);
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

    this.view.render();
    this.html = this.view.el.innerHTML;
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should clear subviews on render', function() {
    expect(this.view.clearSubViews).toHaveBeenCalled();
  });

  it('should render a PaginationView', function() {
    expect(this.PaginationViewSpy).toHaveBeenCalled();
    expect(this.paginationViewStub.render).toHaveBeenCalled();
  });

  it('should create PaginationView with expected args', function() {
    var createdWith = this.PaginationViewSpy.calls.argsFor(0)[0];
    expect(createdWith).toEqual(jasmine.objectContaining({ model: this.paginationModelStub }));

    var viewmodelCreatedWith = this.PaginationModelSpy.calls.argsFor(0)[0];
    expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ visibleCount: jasmine.any(Number) }));
    expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ perPage: jasmine.any(Number) }));
    expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ totalCount: jasmine.any(Number) }));
    expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ page: jasmine.any(Number) }));
    expect(viewmodelCreatedWith).toEqual(jasmine.objectContaining({ urlTo: jasmine.any(Function) }));
  });

  it('should append the PaginationView to this el', function() {
    expect(this.html).toContain('Pagination');
  });

  it('should listen to change events on router model', function() {
    expect(this.router.model.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  afterEach(function() {
    this.view.clean();
  });
});
