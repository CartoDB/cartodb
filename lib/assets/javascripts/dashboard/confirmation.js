const $ = require('jquery');
const ConfirmationView = require('./confirmation/confirmation-view');

const ForbiddenAction = require('builder/data/backbone/network-interceptors/interceptors/forbidden-403');
const NetworkResponseInterceptor = require('builder/data/backbone/network-interceptors/interceptor');
NetworkResponseInterceptor.addURLPattern('api/v1');
NetworkResponseInterceptor.addErrorInterceptor(ForbiddenAction());
NetworkResponseInterceptor.start();

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
