const $ = require('jquery');
const ConfirmPasswordModal = require('dashboard/components/password-confirmation/password-confirmation-view.js');

module.exports = {
  bindEventTo: function (formSelector, options) {
    const form = $(formSelector);
    const saveButton = form.find('.js-save');

    saveButton.bind('click', event => {
      event.preventDefault();
      event.stopPropagation();

      if (!options.passwordConfirmationNeeded) {
        return options.onPasswordTyped() || this.addPasswordToForm(form);
      }

      this.showPasswordModal({
        modalService: options.modals,
        onPasswordTyped: options.onPasswordTyped || this.addPasswordToForm.bind(this, form)
      });
    });
  },

  showPasswordModal: function (options) {
    options.modalService.create(modalModel => {
      return new ConfirmPasswordModal({
        modalModel,
        onPasswordTyped: options.onPasswordTyped
      });
    });
  },

  addPasswordToForm: function (form, password) {
    const passwordInput = document.createElement('input');
    passwordInput.setAttribute('type', 'hidden');
    passwordInput.setAttribute('name', 'password_confirmation');
    passwordInput.setAttribute('value', password);

    form.prepend(passwordInput);
    form.submit();
  }
};
