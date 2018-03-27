const Backbone = require('backbone');
const ServiceInvalidate = require('dashboard/data/service-invalidate-model');
const ServiceDisconnectDialog = require('dashboard/views/account/service-disconnect-dialog/service-disconnect-dialog-view');

describe('dashboard/views/account/service-disconnect-dialog-view', function () {
  let view;

  beforeEach(function () {
    spyOn(ServiceInvalidate.prototype, 'destroy').and.callFake(function (options) {
      options.success(null, {
        success: true
      });
    });

    view = new ServiceDisconnectDialog({
      serviceModel: new Backbone.Model({
        name: 'dropbox',
        title: 'Dropbox',
        state: 'idle',
        revoke_url: '',
        connected: false
      }),
      modalModel: new Backbone.Model()
    });

    spyOn(view, '_reloadWindow');
    view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(view.$('.Dialog-header').length).toBe(1);
      expect(view.$('.Dialog-body').length).toBe(0);
      expect(view.$('.Dialog-footer').length).toBe(1);
      expect(view.$('.Dialog-footer .Button').length).toBe(2);
    });

    it('should show revoke button when revoke url is not present', function () {
      expect(view.$('.js-revoke').length).toBe(1);
    });

    it('should show revoke instructions when revoke url is present', function () {
      view._serviceModel.set('revoke_url', 'https://carto.com');
      view.render();
      expect(view.$('.Dialog-body').length).toBe(1);
      expect(view.$('.js-revoke').length).toBe(0);
      expect(view.$('.Button[href]').length).toBe(1);
    });

    it('should not display the loading', function () {
      expect(this.innerHTML(view)).not.toContain('Revoking access');
    });
  });

  describe('when click revoke', function () {
    beforeEach(function () {
      view.$('.js-revoke').click();
    });

    it('should change to loading state', function () {
      expect(this.innerHTML(view)).toContain('Revoking access');
    });

    describe('when revoking goes well', function () {
      beforeEach(function () {
        ServiceInvalidate.prototype.destroy.calls.argsFor(0)[0].success(null, {
          success: true
        });
      });

      it('should reload if everything goes well', function () {
        expect(view._reloadWindow).toHaveBeenCalled();
      });
    });

    describe('when revoking fails', function () {
      beforeEach(function () {
        spyOn(view, '_closeDialog');
        ServiceInvalidate.prototype.destroy.calls.argsFor(0)[0].success(null, {
          success: false
        });
      });

      it('should close the dialog', function () {
        expect(view._closeDialog).toHaveBeenCalled();
      });

      it('should set the model state to error', function () {
        // error displayed outside of the scope of this modal though
        expect(view._serviceModel.get('state')).toBe('error');
      });
    });
  });

  it('should not have leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view._closeDialog();
  });
});
