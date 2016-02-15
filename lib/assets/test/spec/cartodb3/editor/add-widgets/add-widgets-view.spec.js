var AddWidgetsView = require('../../../../../javascripts/cartodb3/editor/add-widgets/add-widgets-view');

describe('editor/add-widgets/add-widgets-view', function () {
  beforeEach(function () {
    this.modalmodel = {};
    this.view = new AddWidgetsView({
      modalModel: this.modalmodel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
