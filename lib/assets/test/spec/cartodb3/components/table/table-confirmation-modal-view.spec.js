var $ = require('jquery');
var TableConfirmationModalView = require('../../../../../javascripts/cartodb3/components/table/table-confirmation-modal-view');
var templateExample = require('../../../../../javascripts/cartodb3/components/table/head/modals-templates/rename-table-column.tpl');

var simulateENTERKeyPress = function () {
  var e = $.Event('keydown');
  e.keyCode = e.which = $.ui.keyCode.ENTER;
  $(document).trigger(e);
};

describe('components/table/table-confirmation-modal-view', function () {
  beforeEach(function () {
    this.view = new TableConfirmationModalView({
      modalModel: {},
      template: templateExample,
      loadingTitle: 'loading-title',
      renderOpts: {
        columnName: 'pepito',
        newName: 'pepita'
      },
      runAction: function () {}
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('binds', function () {
    it('should render loading view when ok button is clicked', function () {
      spyOn(this.view, '_renderLoadingView');
      this.view.$('.js-confirm').click();
      expect(this.view._renderLoadingView).toHaveBeenCalled();
    });

    it('should runAction when ENTER is pressed', function () {
      spyOn(this.view, '_runAction');
      simulateENTERKeyPress();
      expect(this.view._runAction).toHaveBeenCalled();
    });

    it('should disable ENTER binding when is disabled', function () {
      spyOn(this.view, '_runAction');
      this.view._disableBinds();
      simulateENTERKeyPress();
      expect(this.view._runAction).not.toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
