var CustomCarouselView = require('../../../../../javascripts/cartodb3/components/custom-carousel/custom-carousel-view');

describe('components/custom-carousel/custom-carousel-view', function () {
  beforeEach(function () {
    this.view = new CustomCarouselView({
      options: [
        { val: 'hello', selected: true },
        { val: 'howdy' },
        { val: 'hi' }
      ]
    });
    spyOn(this.view, '_bindScroll');
    spyOn(this.view, '_checkShadows');
    spyOn(this.view, '_checkScroll');
    jasmine.clock().install();
    this.view.render();
    this.view.initScroll();
    jasmine.clock().tick(100);
  });

  beforeEach(function () {
  });

  it('should render properly', function () {
    expect(this.view.$('li').length).toBe(3);
    expect(this.view.$('.Carousel-shadow').length).toBe(2);
  });

  it('should bind scroll', function () {
    expect(this.view._bindScroll).toHaveBeenCalled();
  });

  it('should check shadows', function () {
    expect(this.view._checkShadows).toHaveBeenCalled();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('bind', function () {
    it('should check scroll when selected item changes', function () {
      this.view.collection.at(1).set('selected', true);
      expect(this.view._checkScroll).toHaveBeenCalled();
    });
  });

  describe('unbind', function () {
    it('should not check shadows after unbind', function () {
      this.view._checkShadows.calls.reset();
      this.view._unbindScroll();
      this.view._listContainer().trigger('ps-scroll-x');
      expect(this.view._checkShadows).not.toHaveBeenCalled();
    });
  });

  it('should destroy custom scroll when view is removed', function () {
    spyOn(this.view, '_destroyCustomScroll');
    this.view.clean();
    expect(this.view._destroyCustomScroll).toHaveBeenCalled();
  });
});
