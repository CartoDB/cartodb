var DashboardUrlModel = require('dashboard/data/dashboard-url-model');

describe('dashboard/data/dashboard-url-model', function () {
  beforeEach(function () {
    this.url = new DashboardUrlModel({
      base_url: 'http://team.carto.com/u/pepe/dashboard'
    });
  });

  describe('.datasets', function () {
    beforeEach(function () {
      this.newUrl = this.url.datasets();
    });

    it('should return a new URL pointing for datsets', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url').toString()).toEqual('http://team.carto.com/u/pepe/dashboard/datasets');
    });
  });

  describe('.maps', function () {
    beforeEach(function () {
      this.newUrl = this.url.maps();
    });

    it('should return a new URL for maps', function () {
      expect(this.newUrl).not.toBe(this.url);
      expect(this.newUrl.get('base_url').toString()).toEqual('http://team.carto.com/u/pepe/dashboard/maps');
    });
  });
});
