var VisFetchModel = require('builder/data/visualizations-fetch-model');

describe('common/visualizations-fetch-model', function () {
  beforeEach(function () {
    this.model = new VisFetchModel({
      shared: false,
      page: 1
    });
  });

  describe('.isSearching', function () {
    it('should return true if set to a search or tag query', function () {
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

  describe('.isDeepInsights', function () {
    it('should return true if content_type is maps and deep-insights are enabled', function () {
      this.model.set({
        content_type: 'datasets',
        deepInsights: true
      });
      expect(this.model.isDeepInsights()).toBeFalsy();
      this.model.set({
        content_type: 'maps'
      });
      expect(this.model.isDeepInsights()).toBeTruthy();
      this.model.set({
        deepInsights: false
      });
      expect(this.model.isDeepInsights()).toBeFalsy();
    });
  });
});
