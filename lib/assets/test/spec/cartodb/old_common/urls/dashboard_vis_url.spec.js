describe('cdb.common.DashboardVisUrl', function() {
  beforeEach(function() {
    this.url = new cdb.common.DashboardVisUrl({
      base_url: 'http://team.carto.com/u/pepe/dashboard/maps'
    });
  });

  describe('.lockedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.lockedItems();
    });

    it('should return a new URL pointing at locked items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/maps/locked');
    });
  });

  describe('.sharedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.sharedItems();
    });

    it('should return a new URL pointing at shared items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/maps/shared');
    });
  });

  describe('.likedItems', function() {
    beforeEach(function() {
      this.newUrl = this.url.likedItems();
    });

    it('should return a new URL pointing at liked items', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/dashboard/maps/liked');
    });
  });
});
