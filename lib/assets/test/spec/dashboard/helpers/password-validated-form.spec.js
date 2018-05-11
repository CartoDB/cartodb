const $ = require('jquery');
const ConfirmPasswordModal = require('dashboard/components/password-confirmation/password-confirmation-view.js');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');

const modals = new ModalsServiceModel();

const PASSWORD = 'password';
const formMarkup = `
  <form class="fake-form" action="#" method="POST">
    <button type="button" class="js-save">Save</button>
  </form>
`;

describe('dashboard/helpers/password-validated-form', function () {
  let showPasswordModalSpy;

  beforeEach(function () {
    showPasswordModalSpy = spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped();
      }
    );
  });

  describe('.bindEventTo', function () {
    it('should bind form submit event to show modal method when passwordConfirmationNeeded', function () {
      const onPasswordTypedSpy = jasmine.createSpy('onPasswordTyped');
      const form = $(formMarkup);

      const formElement = document.body.appendChild(form.get(0));

      PasswordValidatedForm.bindEventTo('.fake-form', {
        passwordConfirmationNeeded: true,
        modals,
        onPasswordTyped: onPasswordTypedSpy
      });

      form.find('.js-save').click();

      expect(onPasswordTypedSpy).toHaveBeenCalled();
      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();

      formElement.remove();
    });

    it('should invoke onPasswordTyped callback if password confirmation is not needed ', function () {
      const onPasswordTypedSpy = jasmine.createSpy('onPasswordTyped');
      const form = $(formMarkup);

      const formElement = document.body.appendChild(form.get(0));

      PasswordValidatedForm.bindEventTo('.fake-form', {
        passwordConfirmationNeeded: false,
        modals,
        onPasswordTyped: onPasswordTypedSpy
      });

      form.find('.js-save').click();

      expect(onPasswordTypedSpy).toHaveBeenCalled();
      expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();

      formElement.remove();
    });
  });

  describe('.showPasswordModal', function () {
    it('should show password confirmation modal', function () {
      jasmine.clock().install();

      spyOn(modals, 'create').and.callThrough();
      spyOn(ConfirmPasswordModal.prototype, 'initialize');

      showPasswordModalSpy.and.callThrough();

      PasswordValidatedForm.showPasswordModal({
        modalService: modals
      });

      expect(modals.create).toHaveBeenCalled();
      expect(ConfirmPasswordModal.prototype.initialize).toHaveBeenCalled();

      modals.destroy();
      jasmine.clock().tick(1000);
      jasmine.clock().uninstall();
    });
  });

  describe('.addPasswordToForm', function () {
    it('should inject password into form', function () {
      const form = $(formMarkup);

      spyOn(form, 'submit');

      PasswordValidatedForm.addPasswordToForm(form, PASSWORD);

      const passwordInput = form.find('input[type=hidden]');
      expect(passwordInput.attr('name')).toBe('password_confirmation');
      expect(passwordInput.val()).toBe(PASSWORD);
    });
  });
});
