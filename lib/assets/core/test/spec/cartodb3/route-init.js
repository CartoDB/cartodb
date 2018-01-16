var Backbone = require('backbone');
var Router = require('../../../javascripts/cartodb3/routes/router');
Backbone.history.start({ pushState: false, hashChange: true, root: 'builder/id' });
Router.init({
  modals: {
    destroy: jasmine.createSpy()
  },
  editorModel: {
    set: jasmine.createSpy()
  }
});

// Mock this, because it fails
Router.getCurrentRoute = function () {
  return '/la/promosio';
};
