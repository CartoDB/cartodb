var _ = require('underscore');
var LegendContentView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-content-view');
var LegendSizeTypes = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/size/legend-size-types');

describe('editor/layers/layer-content-view/legend/legend-content-view', function () {
  beforeEach(function () {
    spyOn(LegendContentView.prototype, '_renderForm').and.callThrough();

    this.view = new LegendContentView({
      legendTypes: LegendSizeTypes
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1); // carousel
    expect(this.view.$('.js-carousel').children().length).toBe(1);
    expect(this.view.$('.js-form').children().length).toBe(0);

    this.view._carouselCollection.at(1).set({selected: true});
    expect(_.size(this.view._subviews)).toBe(2); // carousel and form view
    expect(this.view.$('.js-form').children().length).toBe(1);
  });

  it('should render form when carousel changes properly', function () {
    this.view._carouselCollection.at(1).set({selected: true});
    expect(LegendContentView.prototype._renderForm).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

