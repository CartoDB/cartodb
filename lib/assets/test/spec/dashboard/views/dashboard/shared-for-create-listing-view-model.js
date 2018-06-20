const Backbone = require('backbone');
/**
 * Common test cases for a create listing view model.
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForCreateListingViewModel.call(this);
 */
module.exports = function () {
  it('should have listing attr representing current listing view', function () {
    expect(this.model.get('listing')).toEqual(jasmine.any(String));
    expect(this.model.get('listing')).not.toEqual(''); // should have an initial value
  });

  describe('.showLibrary', function () {
    it('should return a boolean for if data library should be loaded', function () {
      expect(this.model.showLibrary()).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.canSelect', function () {
    it('should return a boolean for if user can select an item (more)', function () {
      var datasetModel = new Backbone.Model();
      expect(this.model.canSelect(datasetModel)).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.showDatasets', function () {
    it('should return a boolean for whether to show datasets or not', function () {
      expect(this.model.showDatasets()).toEqual(jasmine.any(Boolean));
    });
  });
};
