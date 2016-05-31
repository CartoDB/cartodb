var MosaicItemModel = require('../../../../../javascripts/cartodb3/components/mosaic/mosaic-item-model');
var MosaicItemView = require('../../../../../javascripts/cartodb3/components/mosaic/mosaic-item-view');

describe('components/mosaic/mosaic-item-view', function () {
  beforeEach(function () {
    this.model = new MosaicItemModel({
      val: 'hello'
    });

    this.view = new MosaicItemView({
      model: this.model
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('button').length).toBe(1);
  });

  describe('hover', function () {
    beforeEach(function () {
      this.view.$el.trigger('mouseenter');
    });

    it('should add class when it is hovered', function () {
      expect(this.model.get('highlighted')).toBeTruthy();
    });

    it('should remove class when it is unhovered', function () {
      this.view.$el.trigger('mouseleave');
      expect(this.model.get('highlighted')).toBeFalsy();
    });
  });

  it('should set selected when it is clicked', function () {
    expect(this.model.get('selected')).toBeFalsy();
    this.view.$el.trigger('click');
    expect(this.model.get('selected')).toBeTruthy();
    expect(this.view.$el.hasClass('is-selected')).toBeTruthy();
  });
});
