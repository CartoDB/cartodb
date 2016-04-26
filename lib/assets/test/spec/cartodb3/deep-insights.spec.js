var deepInsights = require('cartodb-deep-insights.js');
var Backbone = require('backbone');

describe('cartodb-deep-insights.js', function () {
  it('should provide an API on its root namespace', function () {
    expect(deepInsights).toBeDefined();
    expect(deepInsights.createDashboard).toBeDefined();
  });

  it('should use standalone Backbone', function () {
    expect(Backbone).toBeDefined();
  });
});
