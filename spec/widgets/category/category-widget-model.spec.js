var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var specHelper = require('../../spec-helper');
var _ = require('underscore');

describe('widgets/category/category-widget-model', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createCategoryModel(vis.map.layers.first(), {
      column: 'col'
    });
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
  });

  describe('when model is set to collapsed', function () {
    beforeEach(function () {
      this.widgetModel.set('collapsed', true);
    });

    it('should disable dataview', function () {
      expect(this.widgetModel.dataviewModel.get('enabled')).toBe(false);
    });

    describe('when model is expanded', function () {
      beforeEach(function () {
        this.widgetModel.set('collapsed', false);
      });

      it('should enable dataview', function () {
        expect(this.widgetModel.dataviewModel.get('enabled')).toBe(true);
      });
    });
  });

  describe('search state', function () {
    beforeEach(function () {
      this.dataviewModel.filter.accept(['hey']);
      this.dataviewModel._searchModel.setData([{ name: 'hey' }, { name: 'vamos' }, { name: 'neno' }]);
      this.dataviewModel.trigger('change:searchData');
    });

    it('should check if search results are already selected or not', function () {
      var data = this.dataviewModel.getSearchResult();
      expect(data.size()).toBe(3);
      var selectedCategories = data.where({ selected: true });
      var selectedCategory = selectedCategories[0];
      expect(_.size(selectedCategories)).toBe(1);
      expect(selectedCategory.get('name')).toBe('hey');
    });
  });

  describe('colors', function () {
    beforeEach(function () {
      spyOn(this.widgetModel.colors, 'updateData').and.callThrough();
      spyOn(this.widgetModel, 'applyColors').and.callThrough();
    });

    describe('when category names are updated', function () {
      beforeEach(function () {
        this.dataviewModel.set('allCategoryNames', ['foo', 'bar', 'baz']);
      });

      it('should update colors data', function () {
        expect(this.widgetModel.colors.updateData).toHaveBeenCalled();
      });

      it('should not apply colors (since have not been applied yet)', function () {
        expect(this.widgetModel.applyColors).not.toHaveBeenCalled();
      });
    });

    describe('when colors have been applied before', function () {
      beforeEach(function () {
        this.widgetModel.applyColors();
        this.dataviewModel.set('allCategoryNames', ['foo', 'bar', 'baz']);
      });

      it('should update colors data', function () {
        expect(this.widgetModel.colors.updateData).toHaveBeenCalled();
      });

      it('should re-apply them', function () {
        expect(this.widgetModel.applyColors).toHaveBeenCalled();
      });
    });

    describe('.applyColors', function () {
      beforeEach(function () {
        this.widgetModel.applyColors();
      });

      it('should enable colors', function () {
        expect(this.widgetModel.isColorApplied()).toBe(true);
      });

      describe('.cancelColors', function () {
        beforeEach(function () {
          this.widgetModel.cancelColors();
        });

        it('should disable colors', function () {
          expect(this.widgetModel.isColorApplied()).toBe(false);
        });
      });
    });

    describe('locked collection helpers', function () {
      describe('canApplyLocked', function () {
        beforeEach(function () {
          this.dataviewModel.filter.accept(['Hey', 'Neno']);
        });

        it('could apply locked when accepted filter collection size is different than locked collection', function () {
          this.widgetModel.lockedCategories.addItems({ name: 'Neno' });
          expect(this.widgetModel.canApplyLocked()).toBeTruthy();
        });

        it('could apply locked when accepted filter has different items then locked', function () {
          this.widgetModel.lockedCategories.addItems([{ name: 'Neno' }, { name: 'Comeon' }]);
          expect(this.widgetModel.canApplyLocked()).toBeTruthy();
          this.widgetModel.lockedCategories.reset();
          expect(this.widgetModel.canApplyLocked()).toBeTruthy();
        });

        it('could not apply locked when accepted filter has same items than locked collection', function () {
          this.widgetModel.lockedCategories.addItems([{ name: 'Neno' }, { name: 'Hey' }]);
          expect(this.widgetModel.canApplyLocked()).toBeFalsy();
        });
      });

      describe('applyLocked', function () {
        beforeEach(function () {
          this.widgetModel.lockedCategories.reset([{ name: 'Hey', value: 1 }]);
          spyOn(this.widgetModel, 'unlockCategories');
          spyOn(this.dataviewModel.filter, 'applyFilter');
          spyOn(this.widgetModel, 'cleanSearch');
        });

        it('should apply locked state properly', function () {
          this.widgetModel.applyLocked();
          expect(this.widgetModel.unlockCategories).not.toHaveBeenCalled();
          expect(this.widgetModel.cleanSearch).toHaveBeenCalled();
          expect(this.dataviewModel.filter.acceptedCategories.size()).toEqual(1);
          expect(this.dataviewModel.filter.applyFilter).toHaveBeenCalled();
        });

        it('should remove previous accept filters', function () {
          this.dataviewModel.filter.accept('Comeon');
          this.widgetModel.applyLocked();
          expect(this.dataviewModel.filter.isAccepted('Comeon')).toBeFalsy();
        });

        it('should "unlock" categories if locked collection is empty', function () {
          this.widgetModel.lockedCategories.reset();
          this.widgetModel.applyLocked();
          expect(this.widgetModel.unlockCategories).toHaveBeenCalled();
          expect(this.widgetModel.cleanSearch).not.toHaveBeenCalled();
          expect(this.dataviewModel.filter.applyFilter).not.toHaveBeenCalled();
        });
      });

      describe('locked/unlocked', function () {
        beforeEach(function () {
          spyOn(this.dataviewModel, 'forceFetch');
          spyOn(this.dataviewModel.filter, 'acceptAll');
        });

        it('should lock dataview', function () {
          this.widgetModel.lockCategories();
          expect(this.widgetModel.get('locked')).toBeTruthy();
          expect(this.dataviewModel.forceFetch).toHaveBeenCalled();
        });

        it('should unlock dataview', function () {
          this.widgetModel.unlockCategories();
          expect(this.widgetModel.get('locked')).toBeFalsy();
          expect(this.dataviewModel.forceFetch).not.toHaveBeenCalled();
          expect(this.dataviewModel.filter.acceptAll).toHaveBeenCalled();
        });
      });
    });

    describe('filters over data', function () {
      beforeEach(function () {
        this.dataviewModel._data.reset([{ name: 'one' }, { name: 'buddy' }, { name: 'neno' }]);
      });

      it('should count accepted categories over the current data', function () {
        this.dataviewModel.filter.accept('vamos');
        expect(this.widgetModel.sizeAcceptedCatsInData()).toBe(0);
        this.dataviewModel.filter.accept('buddy');
        expect(this.widgetModel.sizeAcceptedCatsInData()).toBe(1);
        this.dataviewModel.filter.reject('neno');
        expect(this.widgetModel.sizeAcceptedCatsInData()).toBe(2);
        this.dataviewModel._data.reset([]);
        expect(this.widgetModel.sizeAcceptedCatsInData()).toBe(0);
      });

      it('should count rejected categories over the current data', function () {
        this.dataviewModel.filter.reject('vamos');
        expect(this.widgetModel.sizeRejectedCatsInData()).toBe(0);
        this.dataviewModel.filter.reject('buddy');
        expect(this.widgetModel.sizeRejectedCatsInData()).toBe(1);
        this.dataviewModel.filter.accept('neno');
        expect(this.widgetModel.sizeRejectedCatsInData()).toBe(1);
        this.dataviewModel._data.reset([]);
        expect(this.widgetModel.sizeRejectedCatsInData()).toBe(0);
      });
    });

    describe('when locked state changes', function () {
      beforeEach(function () {
        spyOn(this.dataviewModel, 'enableFilter');
        spyOn(this.dataviewModel, 'disableFilter');
      });

      it('should update ownFilter attr on dataview model', function () {
        this.widgetModel.set('locked', true);
        expect(this.dataviewModel.enableFilter).toHaveBeenCalled();
        expect(this.dataviewModel.disableFilter).not.toHaveBeenCalled();

        this.widgetModel.set('locked', false);
        expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
      });
    });
  });
});
