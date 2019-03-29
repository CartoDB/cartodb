module.exports = function (currentRoute, modals) {
  var routeName = currentRoute[0];

  if (routeName !== 'modal' && !modals.keepOpenOnRouteChange()) {
    modals.destroy();
  }
};
