var cdb = require('cartodb.js-v3');
var MergeDatasetsModel = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_model');
//
describe('common/dialog/merge_datasets/merge_datasets_model', function() {
  beforeEach(function() {
    this.user = {};
    this.table = TestUtil.createTable('test');
    this.model = new MergeDatasetsModel({
      user: this.user,
      table: this.table
    });
  });

  describe('.headerSteps', function() {
    it('should return an empty array by default', function() {
      expect(this.model.headerSteps()).toEqual([]);
    });

    describe('when have a current step', function() {
      beforeEach(function() {
        this.model.set('currentStep', this.model.get('mergeFlavors').at(0).firstStep());
        this.results = this.model.headerSteps();
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
