var ErrorView = require('builder/components/error/error-view');

describe('components/error/error-view', function () {
  beforeEach(function () {
    this.view = new ErrorView();
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render default texts', function () {
    var html = this.view.$el.html();
    expect(html).toContain('default-title');
    expect(html).toContain('default-desc');
  });

  describe('when given custom title and desc', function () {
    beforeEach(function () {
      this.view.clean();
      this.view = new ErrorView({
        title: 'custom title',
        desc: 'custom desc'
      });
      this.view.render();
    });

    it('should render custom texts instead', function () {
      var html = this.view.$el.html();
      expect(html).not.toContain('default-title');
      expect(html).not.toContain('default-desc');
      expect(html).toContain('custom title');
      expect(html).toContain('custom desc');
    });
  });
});
