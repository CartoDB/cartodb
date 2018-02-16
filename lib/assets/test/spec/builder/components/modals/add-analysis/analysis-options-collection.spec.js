var AnalysisOptionsCollection = require('builder/components/modals/add-analysis/analysis-options-collection');

describe('components/modals/add-analysis/analysis-options-collection', function () {
  beforeEach(function () {
    this.collection = new AnalysisOptionsCollection();
  });

  describe('when reset with some options', function () {
    beforeEach(function () {
      this.collection.reset([
        {
          title: 'A Buffer',
          nodeAttrs: {
            type: 'buffer'
          }
        }, {
          title: 'A Trade-Area',
          nodeAttrs: {
            type: 'trade-area'
          }
        }
      ]);
    });

    it('should create a model for given data', function () {
      expect(this.collection.length).toEqual(2);
      expect(this.collection.first().get('title')).toEqual(jasmine.any(String));
      expect(this.collection.first().getFormAttrs).toEqual(jasmine.any(Function));
    });

    it('should only allow one selection at a time', function () {
      expect(this.collection.pluck('selected')).toEqual([false, false]);

      this.collection.first().set('selected', true);
      expect(this.collection.pluck('selected')).toEqual([true, false]);

      this.collection.last().set('selected', true);
      expect(this.collection.pluck('selected')).toEqual([false, true]);
    });
  });
});
