var PaginationModel = require('new_common/pagination/model');
var PaginationView = require('new_common/pagination/view');

describe('new_common/pagination/view', function() {
  beforeEach(function() {
    this.paginationModel = new PaginationModel({
      totalCount: 9000,
      perPage: 50,
      page: 42
    });

    this.view = new PaginationView({
      model: this.paginationModel
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

  afterEach(function() {
    this.view.clean();
  });
});
