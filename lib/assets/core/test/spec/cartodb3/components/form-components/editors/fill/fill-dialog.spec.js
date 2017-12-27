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

  it('should render the dropdown overlay', function () {
    var subviews = Object.keys(this.view._subviews);
    var isOverlaySubviewRendered = subviews.some(function (subview) {
      return this.view._subviews[subview].$el.hasClass('CDB-Box-modalOverlay');
    }.bind(this));

    expect(subviews.length).not.toBeLessThan(1);
    expect(isOverlaySubviewRendered).toBe(true);
  });
});
