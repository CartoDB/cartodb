/**
 * Common test cases for a create-from-scratch view model in a create listing.
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForCreateFromScratchViewModel.call(this);
 */
module.exports = function() {
  describe('.createFromScratch', function() {
    it('should be a function to set metadata for an upload', function() {
      expect(this.model.createFromScratch).toEqual(jasmine.any(Function));
    });
  });

  describe('.titleForCreateFromScratch', function() {
    it('should return a string for the title of the create from scratch view', function() {
      expect(this.model.titleForCreateFromScratch()).toEqual(jasmine.any(String));
    });
  });

  describe('.explainWhatHappensAfterCreatedFromScratch', function() {
    it('should return a string explaining what happens after is created from scratch is done', function() {
      expect(this.model.explainWhatHappensAfterCreatedFromScratch()).toEqual(jasmine.any(String));
    });
  });

  describe('.labelForCreateFromScratchButton', function() {
    it('should return a string to set on the create button', function() {
      expect(this.model.labelForCreateFromScratchButton()).toEqual(jasmine.any(String));
    });
  });
};
