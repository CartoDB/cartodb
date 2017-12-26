describe('cdb.common.MapUrl', function() {
  beforeEach(function() {
    this.url = new cdb.common.MapUrl({
      base_url: 'http://team.carto.com/u/pepe/viz/8b44c8ba-6fcf-11e4-8581-080027880ca6'
    });
  });

  describe('.edit', function() {
    beforeEach(function() {
      this.newUrl = this.url.edit();
    });

    it('should return a new URL pointing at the page where the map can be edited', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/viz/8b44c8ba-6fcf-11e4-8581-080027880ca6/map');
    });
  });

  describe('.public', function() {
    beforeEach(function() {
      this.newUrl = this.url.public();
    });

    it('should return a new URL pointing at the page where the map can be seen publically', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/viz/8b44c8ba-6fcf-11e4-8581-080027880ca6/public_map');
    });
  });
});
