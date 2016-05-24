var CustomListItemModel = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-item-model');
var CustomListItemView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-item-view');

describe('components/custom-list/custom-list-item-view', function () {
  beforeEach(function () {
    this.model = new CustomListItemModel({
      val: 'hello'
    });

    this.view = new CustomListItemView({
      model: this.model,
      typeLabel: 'column'
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.data('val')).not.toBeUndefined();
    expect(this.view.$('button').length).toBe(1);
    expect(this.view.$('button').attr('title')).toBe(this.model.getName());
  });

  describe('hover', function () {
    beforeEach(function () {
      this.view.$el.trigger('mouseenter');
    });

    it('should add class when it is hovered', function () {
      expect(this.view.$el.hasClass('is-highlighted')).toBeTruthy();
    });

    it('should remove class when it is unhovered', function () {
      this.view.$el.trigger('mouseleave');
      expect(this.view.$el.hasClass('is-highlighted')).toBeFalsy();
    });
  });

  it('should set selected when it is clicked', function () {
    expect(this.model.get('selected')).toBeFalsy();
    this.view.$el.trigger('click');
    expect(this.model.get('selected')).toBeTruthy();
  });
});
