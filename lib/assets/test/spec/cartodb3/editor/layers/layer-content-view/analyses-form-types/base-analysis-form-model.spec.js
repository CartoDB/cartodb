var Backbone = require('backbone');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/base-analysis-form-model');

describe('editor/layers/layer-content-views/analyses-form-types/base-analysis-form-model', function () {
  beforeEach(function () {
    this.model = new BaseAnalysisFormModel(null, {
      collection: new Backbone.Collection()
    });
  });

  describe('.validate', function () {
    beforeEach(function () {
      // a user can't edit a source node, but it serves to assert the default validation logic
      this.model.set({
        type: 'source',
        query: 'SELECT * from somewhere'
      });
      this.model.setSchema({
        // source type can't be edited, but it serves for the example
        query: {}
      });
    });

    it('should be valid when all required params are there', function () {
      expect(this.model.isValid()).toBe(true);
      expect(this.model.validationError).toBeNull();
    });

    it('should be invalid when params are missing', function () {
      this.model.set('query', undefined);
      expect(this.model.isValid()).toBe(false);
      expect(this.model.validationError).toEqual({query: jasmine.any(String)});
    });
  });
});
