var VisFetchModel = require('../../../../javascripts/cartodb/common/visualizations_fetch_model');

describe('common/visualizations_fetch_model', function() {
  beforeEach(function() {
    this.model = new VisFetchModel({
      shared: false,
      page: 1
    });
  });

  describe('.isSearching', function() {
    it('should return true if set to a search or tag query', function() {
      this.model.set({
        q: '',
        tag: ''
      });
      expect(this.model.isSearching()).toBeFalsy();

      this.model.set({
        q: 'foobar',
        tag: ''
      });
      expect(this.model.isSearching()).toBeTruthy();

      this.model.set({
        q: '',
        tag: 'some-tag'
      });
      expect(this.model.isSearching()).toBeTruthy();
    });
  });
});
