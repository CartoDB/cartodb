var handleModalsRoute = require('cartodb3/routes/handle-modals-route');

describe('routes/handleModalsRoute', function () {
  it('should handle modals route', function () {
    var modals = jasmine.createSpyObj('modals', ['destroy']);

    handleModalsRoute(['layer_analyses', 'l1-1', 'a1', null], modals);

    expect(modals.destroy).toHaveBeenCalled();
  });

  it('should not destroy modals when route changes and `keepOnRouteChange` property is enabled', function () {
    var modals = {
      keepOnRouteChange: function () { return true },
      destroy: jasmine.createSpy('destroy')
    };

    handleModalsRoute(['layer_analyses', 'l1-1', 'a1', null], modals);

    expect(modals.destroy).not.toHaveBeenCalled();
  });
});
