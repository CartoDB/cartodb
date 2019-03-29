var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');
var CustomListItemView = require('builder/components/custom-list/custom-list-multi-item-view');

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

  it('should toggle when clicking', function () {
    expect(this.model.get('selected')).toBeFalsy();
    this.view.$el.trigger('click');
    expect(this.model.get('selected')).toBeTruthy();
    this.view.$el.trigger('click');
    expect(this.model.get('selected')).toBeFalsy();
  });
});
