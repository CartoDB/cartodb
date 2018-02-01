var Backbone = require('backbone');
var Router = require('../../../../javascripts/cartodb3/routes/router');

Backbone.history.start({ pushState: false, hashChange: true, root: 'builder/id' });

// // Mock this, because it fails
// Router.getCurrentRoute = function () {
//   return '/la/promosio';
// };

describe('routes/router', function () {
  var editorModel;
  var modals;
  var handleModalsRouteSpy;
  var handleAnalysesRouteSpy;
  var onChangeRouteSpy;

  beforeEach(function () {
    editorModel = new Backbone.Model({
      edition: false
    });

    modals = {
      destroy: jasmine.createSpy()
    };
    handleModalsRouteSpy = jasmine.createSpy();
    handleAnalysesRouteSpy = jasmine.createSpy();

    onChangeRouteSpy = spyOn(Router, '_onChangeRoute');

    Router.init({
      modals: modals,
      editorModel: editorModel,
      handleModalsRoute: handleModalsRouteSpy,
      handleAnalysesRoute: handleAnalysesRouteSpy
    });

    spyOn(Backbone.History.prototype, 'matchRoot').and.returnValue(true);
  });

  afterEach(function () {
    // Reset URL Hashtag. If the URL keeps the hashtag, the test will fail next time.
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  });

  describe('._initBinds', function () {
    it('should handle analyses route', function () {
      onChangeRouteSpy.and.callThrough();
      editorModel.set({ edition: true }, { silent: true });

      Router.navigate('/layer/l1-1/analyses/a1');

      var routeModel = Router.getRouteModel().get('currentRoute');

      expect(handleModalsRouteSpy).toHaveBeenCalledWith(routeModel, modals);
      expect(handleAnalysesRouteSpy).toHaveBeenCalledWith(routeModel);
      expect(editorModel.get('edition')).toBe(false);
    });
  });
});
