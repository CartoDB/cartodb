var PaginationModel = require('new_common/pagination/model');
var PaginationView = require('new_common/pagination/view');

describe('new_common/pagination/view', function() {
  beforeEach(function() {
    this.model = new PaginationModel({
      total_count:  9000,
      per_page:     50,
      current_page: 42,
      url_to:       function(page) { return '/url/to/page/'+ page }
    });
    spyOn(this.model, 'bind').and.callThrough();

    this.view = new PaginationView({
      model: this.model
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
    expect(this.model.bind).toHaveBeenCalledWith('change', jasmine.any(Function));
  });

  describe('given there are no items', function() {
    beforeEach(function() {
      // Effectively tests model event listener and re-rendering too
      this.model.set('total_count', 0);
      this.html = this.view.el.innerHTML;
    });

    it('should not render pagination items', function() {
      expect(this.html).not.toContain('Pagination-label');
      expect(this.html).not.toContain('Pagination-list');
    });
  });


  afterEach(function() {
    this.view.clean();
  });
});
