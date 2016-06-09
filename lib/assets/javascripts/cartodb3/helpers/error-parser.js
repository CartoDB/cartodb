/**
 *  Return error message when backend request fails
 *  It tries to get responseText > errors array, if not gets `statusText`.
 */

module.exports = function (e) {
  if (!e) {
    return 'error';
  }

  var responseText = e.responseText && JSON.parse(e.responseText);
  var errorMessage = e.statusText;

  if (responseText) {
    errorMessage = responseText.errors && responseText.errors.join(',');
  }

  return errorMessage;
};
