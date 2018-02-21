var handleModalsRoute = require('builder/routes/handle-modals-route');

describe('routes/handleModalsRoute', function () {
  it('should handle modals route', function () {
    var modals = {
      keepOpenOnRouteChange: function () { return false; },
      destroy: jasmine.createSpy('destroy')
    };

    handleModalsRoute(['layer_analyses', 'l1-1', 'a1', null], modals);

    expect(modals.destroy).toHaveBeenCalled();
  });

  it('should not destroy modals when route changes and `keepOpenOnRouteChange` property is enabled', function () {
    var modals = {
      keepOpenOnRouteChange: function () { return true; },
      destroy: jasmine.createSpy('destroy')
    };

    handleModalsRoute(['layer_analyses', 'l1-1', 'a1', null], modals);

    expect(modals.destroy).not.toHaveBeenCalled();
  });
});
