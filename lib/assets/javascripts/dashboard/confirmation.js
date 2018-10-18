const $ = require('jquery');
const ConfirmationView = require('./confirmation/confirmation-view');

$(function () {
  const { userCreationId, username, customHosted, userURL } = window;

  const confirmation = new ConfirmationView({ // eslint-disable-line
    el: '.js-info',
    userCreationId,
    username,
    customHosted,
    userURL
  });
});
