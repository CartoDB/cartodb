var Backbone = require('backbone');
var CategoriesListView = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/categories-list/list-view/input-categories-list-view');

describe('components/form-components/editors/fill/input-color/input-qualitative-ramps/categories-list/list-view/input-categories-list-view', function () {
  var view, model;
  var range = ['#000000', '#1D6996'];
  var rangeInRGB = ['rgb(0, 0, 0)', 'rgb(29, 105, 150)'];

  describe('when the attribute is boolean', function () {
    beforeEach(function () {
      model = new Backbone.Model({
        type: 'color',
        attribute: 'fake_boolean_attribute',
        attribute_type: 'boolean',
        images: ['', ''],
        range: range,
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
        // Different browsers may return CSS color values that are logically
        // but not textually equal, e.g., #FFF, #ffffff, and rgb(255,255,255)
        // http://api.jquery.com/css/
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(rangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(rangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(undefined);
      });

      it('should be properly rendered when there are null values', function () {
        var colorRange = ['#5F4690', '#1D6996', '#FFFFFF'];
        var colorRangeInRGB = ['rgb(95, 70, 144)', 'rgb(29, 105, 150)', 'rgb(255, 255, 255)'];

        var model = new Backbone.Model({
          type: 'color',
          attribute: 'fake_boolean_attribute',
          attribute_type: 'boolean',
          images: ['', ''],
          range: colorRange,
          domain: [true, false, null],
          selected: true
        });

        var view = new CategoriesListView({
          maxValues: 10,
          model: model,
          imageEnabled: false
        });

        view.render();
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(colorRangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(colorRangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(colorRangeInRGB[2]);
        view.remove();
      });
    });

    afterEach(function () {
      view.remove();
    });
  });

  describe('when the attribute is numeric', function () {
    beforeEach(function () {
      model = new Backbone.Model({
        type: 'color',
        attribute: 'fake_numeric_attribute',
        attribute_type: 'numeric',
        images: ['', ''],
        range: range,
        domain: [1, 2],
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
        // Different browsers may return CSS color values that are logically
        // but not textually equal, e.g., #FFF, #ffffff, and rgb(255,255,255)
        // http://api.jquery.com/css/
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(rangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(rangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(undefined);
      });

      it('should be properly rendered when there are null values', function () {
        var colorRange = ['#5F4690', '#1D6996', '#FFFFFF'];
        var colorRangeInRGB = ['rgb(95, 70, 144)', 'rgb(29, 105, 150)', 'rgb(255, 255, 255)'];

        var model = new Backbone.Model({
          type: 'color',
          attribute: 'fake_numeric_attribute',
          attribute_type: 'numeric',
          images: ['', ''],
          range: colorRange,
          domain: [1, 2, null],
          selected: true
        });

        var view = new CategoriesListView({
          maxValues: 10,
          model: model,
          imageEnabled: false
        });

        view.render();
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(colorRangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(colorRangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(colorRangeInRGB[2]);
        view.remove();
      });
    });

    afterEach(function () {
      view.remove();
    });
  });

  describe('when the attribute is string', function () {
    beforeEach(function () {
      model = new Backbone.Model({
        type: 'color',
        attribute: 'fake_string_attribute',
        attribute_type: 'string',
        images: ['', ''],
        range: range,
        domain: ['string_attribute_1', 'string_attribute_2'],
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
        // Different browsers may return CSS color values that are logically
        // but not textually equal, e.g., #FFF, #ffffff, and rgb(255,255,255)
        // http://api.jquery.com/css/
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(rangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(rangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(undefined);
      });

      it('should be properly rendered when there are null values', function () {
        var colorRange = ['#5F4690', '#1D6996', '#FFFFFF'];
        var colorRangeInRGB = ['rgb(95, 70, 144)', 'rgb(29, 105, 150)', 'rgb(255, 255, 255)'];

        var model = new Backbone.Model({
          type: 'color',
          attribute: 'fake_string_attribute',
          attribute_type: 'date',
          images: ['', ''],
          range: colorRange,
          domain: ['string_attribute_1', 'string_attribute_2', null],
          selected: true
        });

        var view = new CategoriesListView({
          maxValues: 10,
          model: model,
          imageEnabled: false
        });

        view.render();
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(colorRangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(colorRangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(colorRangeInRGB[2]);
        view.remove();
      });
    });

    afterEach(function () {
      view.remove();
    });
  });

  describe('when the attribute is a date', function () {
    beforeEach(function () {
      model = new Backbone.Model({
        type: 'color',
        attribute: 'fake_date_attribute',
        attribute_type: 'date',
        images: ['', ''],
        range: range,
        domain: ['2018-01-01T00:00:00+00:00', '2018-01-02T00:00:00+00:00'],
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
        // Different browsers may return CSS color values that are logically
        // but not textually equal, e.g., #FFF, #ffffff, and rgb(255,255,255)
        // http://api.jquery.com/css/
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(rangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(rangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(undefined);
      });

      it('should be properly rendered when there are null values', function () {
        var colorRange = ['#5F4690', '#1D6996', '#FFFFFF'];
        var colorRangeInRGB = ['rgb(95, 70, 144)', 'rgb(29, 105, 150)', 'rgb(255, 255, 255)'];

        var model = new Backbone.Model({
          type: 'color',
          attribute: 'fake_date_attribute',
          attribute_type: 'date',
          images: ['', ''],
          range: colorRange,
          domain: ['2018-01-01T00:00:00+00:00', '2018-01-02T00:00:00+00:00', null],
          selected: true
        });

        var view = new CategoriesListView({
          maxValues: 10,
          model: model,
          imageEnabled: false
        });

        view.render();
        expect(view.$('.js-color:eq(0)').css('background-color')).toEqual(colorRangeInRGB[0]);
        expect(view.$('.js-color:eq(1)').css('background-color')).toEqual(colorRangeInRGB[1]);
        expect(view.$('.js-color:eq(2)').css('background-color')).toEqual(colorRangeInRGB[2]);
        view.remove();
      });
    });

    afterEach(function () {
      view.remove();
    });
  });
});
