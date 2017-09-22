var FlashMessageModel = require('../../../../javascripts/cartodb/organization/flash_message_model');
var FlashMessageView = require('../../../../javascripts/cartodb/organization/flash_message_view');

describe('organization/flash_message_view', function () {
  beforeEach(function () {
    this.model = new FlashMessageModel();
    this.view = new FlashMessageView({
      model: this.model
    });
    this.view.render();
  });

  it('should not display the view since there is no message', function () {
    expect(this.view.el.outerHTML).toContain('display: none');
  });

  describe('when model.show is called', function () {
    beforeEach(function () {
      this.model.show('ERR!');
    });

    it('should show view', function () {
      expect(this.view.el.outerHTML).not.toContain('display: none');
      expect(this.view.el.outerHTML).toContain('ERR!');
    });

    describe('when model.hide is called', function () {
      beforeEach(function () {
        this.model.hide();
      });

      it('should hide view', function () {
        expect(this.view.el.outerHTML).toContain('display: none');
      });
    });
  });
});
