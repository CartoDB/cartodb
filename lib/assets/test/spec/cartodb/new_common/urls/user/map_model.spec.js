var MapUrl = require('new_common/urls/user/map_model');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls/user/map_model", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      id: 1,
      username: 'pepe'
    });

    this.userUrl = new UserUrl({
      user: this.user,
      account_host: 'host.ext'
    });

    this.vis = new cdbAdmin.Visualization({
      id: 'abc-123-c'
    });

    this.mapUrl = new MapUrl({
      userUrl: this.userUrl,
      vis: this.vis
    });
  });

  describe('.toEdit', function() {
    it('should return URL to edit map', function() {
      expect(this.mapUrl.toEdit()).toMatch('(http|file)://pepe.host.ext/viz/abc-123-c/map');
    });
  });

  describe('.toPublic', function() {
    it('should return URL to show the map', function() {
      expect(this.mapUrl.toPublic()).toMatch('(http|file)://pepe.host.ext/viz/abc-123-c/public_map');
    });
  });
});
