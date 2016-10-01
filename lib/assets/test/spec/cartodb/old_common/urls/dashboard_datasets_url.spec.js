describe('cdb.common.DashboardDatasetsUrl', function() {
  beforeEach(function() {
    this.url = new cdb.common.DashboardDatasetsUrl({
      base_url: 'http://team.carto.com/u/pepe/dashboard/datasets'
    });
  });

  describe('.lockedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.lockedItems();
    });

    it('should return a new URL pointing at locked items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/datasets/locked');
    });
  });

  describe('.sharedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.sharedItems();
    });

    it('should return a new URL pointing at shared items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/datasets/shared');
    });
  });

  describe('.likedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.likedItems();
    });

    it('should return a new URL pointing at liked items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/datasets/liked');
    });
  });

  describe('.dataLibrary', function() {
    beforeEach(function() {
      this.newUrl = this.url.dataLibrary();
    });

    it('should return a new URL pointing at data library', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/datasets/library');
    });
  });
});
