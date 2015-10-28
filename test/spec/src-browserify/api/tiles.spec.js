var reqwest = require('reqwest');
require('ajax-proxy').set(reqwest.compat);

var Tiles = require('../../../../src-browserify/api/tiles');

describe('api/tiles', function() {
  beforeEach(function() {
    this.tiles = new Tiles({
      sublayers: [],
      user_name: 'pepe'
    });
  });

  it('should create a tiles object', function() {
    expect(this.tiles).toBeDefined();
  });
});
