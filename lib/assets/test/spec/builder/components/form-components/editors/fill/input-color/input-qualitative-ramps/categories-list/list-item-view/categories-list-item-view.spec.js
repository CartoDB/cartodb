var CustomListItemModel = require('builder/components/custom-list/custom-list-item-model');
var CategoriesListItemView = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/categories-list/list-item-view/categories-list-item-view');
var inputColorCategoriesListItemTemplate = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/categories-list/list-item-view/categories-list-item.tpl');

describe('components/form-components/editors/fill/input-color/input-qualitative-ramps/categories-list/list-item-view/categories-list-item-view', function () {
  beforeEach(function () {
    this.model = new CustomListItemModel({
      label: 'hello',
      val: '#FFF',
      image: 'https://s3.amazonaws.com/com.cartodb.users-assets.production/maki-icons/star-stroked-18.svg'
    });

    this.view = new CategoriesListItemView(({
      model: this.model,
      typeLabel: 'column',
      template: inputColorCategoriesListItemTemplate,
      imageEnabled: true
    }));

    spyOn(this.view, '_loadImages');

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.CDB-Text').length).toBe(1);
    expect(this.view.$('.CDB-Text').attr('title')).toBe('hello');
    expect(this.view.$('.js-colorPicker').attr('style')).toBe('background-color: #FFF;');
    expect(this.view.$('.js-image-container').length).toBe(1);
  });

  describe('_onClick', function () {
    it('should set js-assetPicker class in model when image is clicked', function () {
      this.view.$('.js-image-container').click();
      expect(this.model.get('selectedClass')).toEqual(['js-assetPicker']);
    });

    it('should set js-assetPicker class in model when IMG label is clicked', function () {
      this.model.unset('image');
      this.view.render();
      this.view.$('.js-assetPicker').click();
      expect(this.model.get('selectedClass')).toEqual(['js-assetPicker']);
    });

    it('should not set js-assetPicker class in model when rest of the item is clicked', function () {
      this.model.unset('image');
      this.view.render();
      this.view.$el.click();
      expect(this.model.get('selectedClass')).toEqual([]);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
