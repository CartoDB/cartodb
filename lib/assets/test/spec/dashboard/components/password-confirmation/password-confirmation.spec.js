const _ = require('underscore');
const Backbone = require('backbone');
const PasswordConfirmationView = require('dashboard/components/password-confirmation/password-confirmation-view');

const PASSWORD = 'password';

describe('dashboard/components/password-confirmation/password-confirmation-view', function () {
  let view;

  const createViewFn = function (viewOptions) {
    const view = new PasswordConfirmationView(
      _.extend({
        modalModel: new Backbone.Model(),
        onPasswordTyped: () => {}
      }, viewOptions)
    );

    return view;
  };

  afterEach(function () {
    if (view) view.clean();
  });

  it('should render properly', function () {
    view = createViewFn();
    view.render();

    expect(view.$('h2').text()).toContain('components.modals.password-confirmation.modal-title');
    expect(view.$('p').text()).toContain('components.modals.password-confirmation.modal-description');
    expect(view.$('.js-cancel').text()).toContain('components.modals.password-confirmation.actions.cancel');
    expect(view.$('.js-ok').text()).toContain('components.modals.password-confirmation.actions.confirm');
  });

  it('should invoke confirm callback with password as an argument when clicking confirm', function () {
    const okCallbackSpy = jasmine.createSpy();

    view = createViewFn({
      onPasswordTyped: okCallbackSpy
    });
    view._isConfirmDisabled = false;
    view.render();
    view.$('.js-password').val(PASSWORD);

    view.$('.js-ok').click();

    expect(okCallbackSpy).toHaveBeenCalledWith(PASSWORD);
  });

  it('should not invoke password typed callback when dismissing modal', function () {
    const okCallbackSpy = jasmine.createSpy();

    view = createViewFn({
      onPasswordTyped: okCallbackSpy
    });
    view.render();

    view.$('.js-cancel').click();

    expect(okCallbackSpy).not.toHaveBeenCalled();
  });

  it('should enable confirm button when password input is filled in', function () {
    view = createViewFn();
    view.render();

    expect(view.$('.js-ok').hasClass('is-disabled')).toBe(true);

    view.$('.js-password').val(PASSWORD);
    view.$('.js-password').trigger('input');

    expect(view.$('.js-ok').hasClass('is-disabled')).toBe(false);
  });
});
