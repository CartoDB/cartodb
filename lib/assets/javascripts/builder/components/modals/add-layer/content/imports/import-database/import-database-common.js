export function enableButton (elementButton) {
  elementButton.removeAttr('disabled');
  elementButton.removeClass('is-disabled');
}

export function disableButton (elementButton) {
  elementButton.attr('disabled', 'disabled');
  elementButton.addClass('is-disabled');
}
