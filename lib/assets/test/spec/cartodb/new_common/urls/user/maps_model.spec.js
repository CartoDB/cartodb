var MapsUrl = require('new_common/urls/user/maps_model');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls/user/maps_model", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      id: 1,
      username: 'pepe'
    });

    this.userUrl = new UserUrl({
      user: this.user,
      account_host: 'host.ext'
    });

    this.url = new MapsUrl({
      userUrl: this.userUrl
    });
  });

  describe('.toDefault', function() {
    it('should return URL to default page', function() {
      expect(this.url.toDefault()).toMatch('(http|file)://pepe.host.ext/dashboard/maps');
    });
  });

  describe('.toLocked', function() {
    it('should return URL to locked maps', function() {
      expect(this.url.toLocked()).toMatch('(http|file)://pepe.host.ext/dashboard/maps/locked');
    });
  });

  describe('.toShared', function() {
    it('should return URL to shared maps', function() {
      expect(this.url.toShared()).toMatch('(http|file)://pepe.host.ext/dashboard/maps/shared');
    });
  });

  describe('.toLiked', function() {
    it('should return URL to liked maps', function() {
      expect(this.url.toLiked()).toMatch('(http|file)://pepe.host.ext/dashboard/maps/liked');
    });
  });
});
