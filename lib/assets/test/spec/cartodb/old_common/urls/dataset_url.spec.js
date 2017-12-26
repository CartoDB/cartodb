describe('cdb.common.DatasetUrl', function() {
  beforeEach(function() {
    this.url = new cdb.common.DatasetUrl({
      base_url: 'http://team.carto.com/u/pepe/tables/awesome_data'
    });
  });

  describe('.edit', function() {
    beforeEach(function() {
      this.newUrl = this.url.edit();
    });

    it('should return a new URL pointing at the page where the map can be edited', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/tables/awesome_data');
    });
  });

  describe('.public', function() {
    beforeEach(function() {
      this.newUrl = this.url.public();
    });

    it('should return a new URL pointing at the page where the map can be seen publically', function() {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url')).toEqual('http://team.carto.com/u/pepe/tables/awesome_data/public');
    });
  });
});
