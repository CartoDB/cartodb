const $ = require('jquery');
const ConfirmationView = require('./confirmation/confirmation-view');

$(function () {
  const { userCreationId, username, customHosted, userURL } = window;

  const confirmation = new ConfirmationView({ // eslint-disable-line
    userCreationId,
    username,
    customHosted,
    userURL
  });
});
