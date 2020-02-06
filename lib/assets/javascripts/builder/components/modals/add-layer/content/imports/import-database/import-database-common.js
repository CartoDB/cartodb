export function enableButton (elementButton) {
  elementButton.prop('disabled', false);
  elementButton.removeClass('is-disabled');
}

export function disableButton (elementButton) {
  elementButton.prop('disabled', true);
  elementButton.addClass('is-disabled');
}
