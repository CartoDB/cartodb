var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');

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

  it('should add disabled class if it has disabled property', function () {
    expect(this.view.$el.hasClass('is-disabled')).toBeFalsy();
    this.model.set('disabled', true);
    this.view.render();
    expect(this.view.$el.hasClass('is-disabled')).toBeTruthy();
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

  it('shouldn\'t toggle by default when clicking', function () {
    expect(this.model.get('selected')).toBeFalsy();
    this.view.$el.trigger('click');
    this.view.$el.trigger('click');
    expect(this.model.get('selected')).toBeTruthy();
  });
});
