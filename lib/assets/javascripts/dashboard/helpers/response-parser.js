module.exports = function (response) {
  const responseJSON = response && response.responseJSON;
  let errors = responseJSON && responseJSON.message;

  if (responseJSON && responseJSON.errors && responseJSON.errors.length) {
    errors = responseJSON.errors.join('. ') + '. ';
  }

  return errors;
};
