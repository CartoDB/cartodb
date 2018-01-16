var Backbone = require('backbone');
var Router = require('../../../javascripts/cartodb3/routes/router');
var RouterHelpers = require('../../../javascripts/cartodb3/routes/helpers');

describe('editor.js', function () {
  beforeEach(function () {
    spyOn(Backbone.History.prototype, 'matchRoot').and.returnValue(true);
    spyOn(RouterHelpers, 'handleAnalysesRoute');
  });

  afterEach(function () {
    // Reset URL Hashtag. If the URL keeps the hashtag, the test will fail next time.
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  });

  it('should handle analyses route', function () {
    Router.navigate('/layer/l1-1/analyses/a1');
    expect(RouterHelpers.handleAnalysesRoute).toHaveBeenCalledWith(Router.getRouteModel());
  });
});
