var FillDialogModel = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/fill-dialog-model');
var FillDialogView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/fill-dialog');

describe('components/form-components/editors/fill/fill-dialog', function () {
  beforeEach(function () {
    this.model = new FillDialogModel({
    });

    this.view = new FillDialogView(({
      model: this.model
    }));
    this.view.render();
  });

  xit('should get rendered', function () {
    // TODO
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
