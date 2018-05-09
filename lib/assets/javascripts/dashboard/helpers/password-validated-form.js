const $ = require('jquery');
const ConfirmPasswordModal = require('dashboard/components/password-confirmation/password-confirmation-view.js');

module.exports = {
  bindEventTo: function (formSelector, modalsInstance, onPasswordTyped) {
    const form = $(formSelector);
    const saveButton = form.find('.js-save');

    saveButton.bind('click', event => {
      event.preventDefault();
      event.stopPropagation();

      modalsInstance.create(modalModel => {
        return new ConfirmPasswordModal({
          modalModel,
          onPasswordTyped: onPasswordTyped || this.addPasswordToForm.bind(this, form)
        });
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
