var BasemapFormView = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-form-view');

describe('editor/layers/basemap-content-views/basemap-form-view', function () {
  beforeEach(function () {
    this.view = new BasemapFormView({
    });

    this.view.render();
  });

  it('should render properly', function () {
    // expect(this.view.$('.Carousel-item').length).toBe(2);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
