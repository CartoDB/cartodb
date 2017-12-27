var _ = require('underscore');
var FillDialogModel = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/fill-dialog-model');
var FillDialogView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/fill-dialog');

describe('components/form-components/editors/fill/fill-dialog', function () {
  var createViewFn = function () {
    this.model = new FillDialogModel({});

    var view = new FillDialogView(({
      model: this.model
    }));

    return view;
  };

  beforeEach(function () {
    this.view = createViewFn();
  });

  xit('should get rendered', function () {
    // TODO
  });

  it('should not have leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });

  it('should render properly', function () {
    this.view.render();
    expect(_.size(this.view._subviews)).toBe(2);
  });
});
