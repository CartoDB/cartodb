var Backbone = require('backbone');
var Router = require('../../../javascripts/cartodb3/routes/router');
var RouterHelpers = require('../../../javascripts/cartodb3/routes/helpers');

describe('editor.js', function () {
  beforeEach(function () {
    spyOn(RouterHelpers, 'handleAnalysesRoute');
  });

  it('should handle analyses route', function () {
    Router.navigate('/analyses');
    expect(RouterHelpers.handleAnalysesRoute).toHaveBeenCalledWith();
  });
});
