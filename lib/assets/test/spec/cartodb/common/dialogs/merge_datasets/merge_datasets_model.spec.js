var MergeDatasetsModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_model');

describe('common/dialog/merge_datasets/merge_datasets_model', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('test');
    this.model = new MergeDatasetsModel({
      table: this.table
    });
  });

  describe('.allSteps', function() {
    it('should return an empty array by default', function() {
      expect(this.model.allSteps()).toEqual([]);
    });

    describe('when a step is selected', function() {
      beforeEach(function() {
        this.model.get('mergeFlavors').at(0).set('selected', true);
        this.results = this.model.allSteps();
      });

      it('should return all the steps from there', function() {
        expect(this.results.length).toBeGreaterThan(0);
      });

      it('should contain title and icon for each step', function() {
        this.results.forEach(function(item) {
          expect(item.icon).toEqual(jasmine.any(String));
          expect(item.title).toEqual(jasmine.any(String));
          expect(item.isCurrent).toEqual(jasmine.any(Boolean));
        });
      });
    });
  });
});
