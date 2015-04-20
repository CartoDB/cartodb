/**
 * Common test cases for a create listing view model.
 * Expected to be called in the context of the top-describe closure of an option model, e.g.:
 *   describe('...', function() {
 *     beforeEach(function() {
 *       this.model = new Model({});
 *     });
 *     sharedForCreateListingViewModel.call(this);
 */
module.exports = function() {

  it('should have listing attr representing current listing view', function() {
    expect(this.model.get('listing')).toEqual(jasmine.any(String));
    expect(this.model.get('listing')).not.toEqual(''); // should have an initial value
  });

  describe('.isListingSomething', function() {
    it('should return a boolean if something is being listed (datasets, import, empty)', function() {
      expect(this.model.isListingSomething()).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.showLibrary', function() {
    it('should return a boolean for if data library should be loaded', function() {
      expect(this.model.showLibrary()).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.maybePrefetchDatasets', function() {
    it('should be a function to prefetch datasets, for the created view list internal logic defined if', function() {
      expect(this.model.maybePrefetchDatasets).toEqual(jasmine.any(Function));
    });
  });

  describe('.canChangeSelectedState', function() {
    it('should return a boolean for if user can select an item (more)', function() {
      var datasetModel = new cdb.core.Model();
      expect(this.model.canChangeSelectedState(datasetModel)).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.showDatasets', function() {
    it('should return a boolean for whether to show datasets or not', function() {
      expect(this.model.showDatasets()).toEqual(jasmine.any(Boolean));
    });
  });

  describe('.setUpload', function() {
    it('should set some upload data given an object', function() {
      expect(this.model.setUpload({
        foo: 'bar',
        create_vis: false
      })).toEqual(undefined);
    });
  });
};
