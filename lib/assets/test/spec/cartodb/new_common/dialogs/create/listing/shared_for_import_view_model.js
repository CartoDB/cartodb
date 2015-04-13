/**
 * Common test cases for a import view model in a create listing.
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForImportViewModel.call(this);
 */
module.exports = function() {
  describe('.setUpload', function() {
    it('should be a function to set metadata for an upload', function() {
      expect(this.model.setUpload).toEqual(jasmine.any(Function));
    });
  });

  describe('.setActiveImportPane', function() {
    it('should be a function to set which pane is currently active', function() {
      expect(this.model.setActiveImportPane).toEqual(jasmine.any(Function));
    });
  });
};
