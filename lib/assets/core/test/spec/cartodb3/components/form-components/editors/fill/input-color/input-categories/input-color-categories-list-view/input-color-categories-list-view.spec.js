var Backbone = require('backbone');
var CategoriesListView = require('../../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-categories/input-color-categories-list-view/input-color-categories-list-view');

describe('components/form-components/editors/fill/input-color/input-categories/input-color-categories-list-view/input-color-categories-list-view', function () {
  var view;
  var model;

  describe('when the attribute is boolean', function () {
    beforeEach(function () {
      model = new Backbone.Model({
        type: 'color',
        attribute: 'fake_boolean_attribute',
        attribute_type: 'boolean',
        images: ['', ''],
        range: ['#5F4690', '#1D6996'],
        domain: [true, false],
        selected: true
      });

      view = new CategoriesListView({
        maxValues: 10,
        model: model,
        imageEnabled: false
      });

      view.render();
    });

    describe('.render', function () {
      it('should have a back button', function () {
        expect(view.$('.js-back')).toBeDefined();
      });

      it('should back button should have the "Color schemes" label', function () {
        expect(view.$('.label').text().trim()).toEqual('Color Schemes');
      });

      it('should be properly rendered', function () {
        pending('IMPLEMENT ME');
      });

      it('should be properly rendered when there are null values', function () {
        pending('IMPLEMENT ME');
      });
    });

    afterEach(function () {
      view.remove();
    });
  });

  describe('when the attribute is numeric', function () {
    it('.render', function () {
      pending('IMPLEMENT ME');
    });
  });

  describe('when the attribute is string', function () {
    it('.render', function () {
      pending('IMPLEMENT ME');
    });
  });

  describe('when the attribute is a date', function () {
    it('.render', function () {
      pending('IMPLEMENT ME');
    });
  });

  // TODO: Add test for edge cases: (ie: more than 11 values un attribute domain)
});
