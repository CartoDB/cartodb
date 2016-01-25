var cdb = require('cartodb-deep-insights.js');

describe('cartodb-deep-insights.js', function () {
  it('should provide an API on the cdb namespace', function () {
    expect(cdb).toBeDefined();
    expect(cdb.deepInsights).toBeDefined();
  });
});
