var cdb = require('cartodb.js-v3');
var ServiceInvalidate = require('../../../../javascripts/cartodb/common/service_models/service_invalidate_model');
var ServiceDisconnectDialog = require('../../../../javascripts/cartodb/account/service_disconnect_dialog_view');

describe('account/service_disconnect_dialog_view', function() {
  var view;

  beforeEach(function() {
    ServiceInvalidate.prototype.destroy = function(a) {
      a.success(null, {
        success: true
      });
    };
    view = new ServiceDisconnectDialog({
      model: new cdb.core.Model({
        name: "dropbox",
        title: "Dropbox",
        state: "idle",
        revoke_url: "",
        connected: false
      }),
      clean_on_hide: true,
      enter_to_confirm: false
    });

    spyOn(view, '_reloadWindow');
    view.render();
  });

  describe('render', function() {

    it("should render properly", function() {
      expect(view.$('.Dialog-header').length).toBe(1);
      expect(view.$('.Dialog-body').length).toBe(0);
      expect(view.$('.Dialog-footer').length).toBe(1);
      expect(view.$('.Dialog-footer .Button').length).toBe(2);
    });

    it("should show revoke button when revoke url is not present", function() {
      expect(view.$('.js-revoke').length).toBe(1);
    });

    it("should show revoke instructions when revoke url is present", function() {
      view.model.set('revoke_url', 'https://cartodb.com');
      view.render();
      expect(view.$('.Dialog-body').length).toBe(1);
      expect(view.$('.js-revoke').length).toBe(0);
      expect(view.$('.Button[href]').length).toBe(1);
    });

    it('should not display the loading', function() {
      expect(this.innerHTML(view)).not.toContain('Revoking access');
    });
  });

  describe('when click revoke', function() {
    beforeEach(function() {
      spyOn(ServiceInvalidate.prototype, 'destroy');
      view.$('.js-revoke').click();
    });

    it("should change to loading state", function() {
      expect(this.innerHTML(view)).toContain('Revoking access');
    });

    describe('when revoking goes well', function() {
      beforeEach(function() {
        ServiceInvalidate.prototype.destroy.calls.argsFor(0)[0].success(null, {
          success: true
        });
      });

      it("should reload if everything goes well", function() {
        expect(view._reloadWindow).toHaveBeenCalled();
      });
    });

    describe('when revoking fails', function() {
      beforeEach(function() {
        spyOn(view, 'close');
        ServiceInvalidate.prototype.destroy.calls.argsFor(0)[0].success(null, {
          success: false
        });
      });

      it("should close the dialog", function() {
        expect(view.close).toHaveBeenCalled();
      });

      it('should set the model state to error', function() {
        // error displayed outside of the scope of this modal though
        expect(view.model.get('state')).toBe('error');
      });
    });
  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function() {
    view.close();
  })

});
