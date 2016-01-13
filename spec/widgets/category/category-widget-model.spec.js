var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');

describe('widgets/category/category-widget-model', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
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

    describe('locked collection helpers', function () {
      describe('canApplyLocked', function () {
        beforeEach(function () {
          this.dataviewModel.filter.accept(['Hey', 'Neno']);
        });

        it('could apply locked when accepted filter collection size is different than locked collection', function () {
          this.model.lockedCategories.addItems({ name: 'Neno' });
          expect(this.model.canApplyLocked()).toBeTruthy();
        });

        it('could apply locked when accepted filter has different items then locked', function () {
          this.model.lockedCategories.addItems([{ name: 'Neno' }, { name: 'Comeon' }]);
          expect(this.model.canApplyLocked()).toBeTruthy();
          this.model.lockedCategories.reset();
          expect(this.model.canApplyLocked()).toBeTruthy();
        });

        it('could not apply locked when accepted filter has same items than locked collection', function () {
          this.model.lockedCategories.addItems([{ name: 'Neno' }, { name: 'Hey' }]);
          expect(this.model.canApplyLocked()).toBeFalsy();
        });
      });

      describe('applyLocked', function () {
        beforeEach(function () {
          this.model.lockedCategories.reset([{ name: 'Hey', value: 1 }]);
          spyOn(this.model, 'unlockCategories');
          spyOn(this.dataviewModel.filter, 'applyFilter');
          spyOn(this.model, 'cleanSearch');
        });

        it('should apply locked state properly', function () {
          this.model.applyLocked();
          expect(this.model.unlockCategories).not.toHaveBeenCalled();
          expect(this.model.cleanSearch).toHaveBeenCalled();
          expect(this.dataviewModel.filter.acceptedCategories.size()).toEqual(1);
          expect(this.dataviewModel.filter.applyFilter).toHaveBeenCalled();
        });

        it('should remove previous accept filters', function () {
          this.dataviewModel.filter.accept('Comeon');
          this.model.applyLocked();
          expect(this.dataviewModel.filter.isAccepted('Comeon')).toBeFalsy();
        });

        it('should "unlock" categories if locked collection is empty', function () {
          this.model.lockedCategories.reset();
          this.model.applyLocked();
          expect(this.model.unlockCategories).toHaveBeenCalled();
          expect(this.model.cleanSearch).not.toHaveBeenCalled();
          expect(this.dataviewModel.filter.applyFilter).not.toHaveBeenCalled();
        });
      });

      describe('locked/unlocked', function () {
        beforeEach(function () {
          spyOn(this.dataviewModel, 'forceFetch');
          spyOn(this.dataviewModel.filter, 'acceptAll');
        });

        it('should lock dataview', function () {
          this.model.lockCategories();
          expect(this.model.get('locked')).toBeTruthy();
          expect(this.dataviewModel.forceFetch).toHaveBeenCalled();
        });

        it('should unlock dataview', function () {
          this.model.unlockCategories();
          expect(this.model.get('locked')).toBeFalsy();
          expect(this.dataviewModel.forceFetch).not.toHaveBeenCalled();
          expect(this.dataviewModel.filter.acceptAll).toHaveBeenCalled();
        });
      });
    });

    describe('when locked state changes', function () {
      beforeEach(function () {
        spyOn(this.dataviewModel, 'enableFilter');
        spyOn(this.dataviewModel, 'disableFilter');
      });

      it('should update ownFilter attr on dataview model', function () {
        this.model.set('locked', true);
        expect(this.dataviewModel.disableFilter).toHaveBeenCalled();
        expect(this.dataviewModel.enableFilter).not.toHaveBeenCalled();

        this.model.set('locked', false);
        expect(this.dataviewModel.enableFilter).toHaveBeenCalled();
      });
    });
  });
});
