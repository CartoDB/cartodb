var cdb = require('cartodb.js');
var Backbone = require('backbone');

describe('cartodb-deep-insights.js', function () {
  it('should provide an API on the cdb namespace', function () {
    expect(cdb).toBeDefined();
    expect(cdb.deepInsights).toBeDefined();
  });

  it('should use standalone Backbone', function () {
    expect(Backbone).toBeDefined();
  });
});
