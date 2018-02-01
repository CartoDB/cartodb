var handleModalsRoute = require('../../../../javascripts/cartodb3/routes/handle-modals-route');

describe('routes/handleModalsRoute', function () {
  it('should handle modals route', function () {
    var modals = jasmine.createSpyObj('modals', ['destroy']);

    handleModalsRoute(['layer_analyses', 'l1-1', 'a1', null], modals);

    expect(modals.destroy).toHaveBeenCalled();
  });
});
