var CategoryDataviewModel = require('../../../src/dataviews/category-dataview-model');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var CategoryFilter = require('../../../src/windshaft/filters/category');

describe('widgets/category/category-widget-model', function () {
  beforeEach(function () {
    this.dataviewModel = new CategoryDataviewModel({}, {
      filter: new CategoryFilter()
    });
    this.model = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
  });

  describe('colors', function () {
    beforeEach(function () {
      spyOn(this.model.colors, 'updateData').and.callThrough();
      spyOn(this.model, 'applyColors').and.callThrough();
    });

    describe('when category names are updated', function () {
      beforeEach(function () {
        this.dataviewModel.set('allCategoryNames', ['foo', 'bar', 'baz']);
      });

      it('should update colors data', function () {
        expect(this.model.colors.updateData).toHaveBeenCalled();
      });

      it('should not apply colors (since have not been applied yet)', function () {
        expect(this.model.applyColors).not.toHaveBeenCalled();
      });
    });

    describe('when colors have been applied before', function () {
      beforeEach(function () {
        this.model.applyColors();
        this.dataviewModel.set('allCategoryNames', ['foo', 'bar', 'baz']);
      });

      it('should update colors data', function () {
        expect(this.model.colors.updateData).toHaveBeenCalled();
      });

      it('should re-apply them', function () {
        expect(this.model.applyColors).toHaveBeenCalled();
      });
    });

    describe('.applyColors', function () {
      beforeEach(function () {
        this.model.applyColors();
      });

      it('should enable colors', function () {
        expect(this.model.isColorApplied()).toBe(true);
      });

      describe('.cancelColors', function () {
        beforeEach(function () {
          this.model.cancelColors();
        });

        it('should disable colors', function () {
          expect(this.model.isColorApplied()).toBe(false);
        });
      });
    });
  });
});
