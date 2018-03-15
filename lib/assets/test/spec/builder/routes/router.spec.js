var Backbone = require('backbone');
var Router = require('builder/routes/router');

Backbone.history.start({ pushState: false, hashChange: true, root: 'builder/id' });

// REMEMBER:
// The router is a singletone and can be initialized only once.
// This means that you'll have to reset the models you need manually before each test.

describe('routes/router', function () {
  var editorModel;
  var modals;
  var widgetDefinitionsCollection;
  var handleModalsRouteSpy;
  var handleAnalysesRouteSpy;
  var handleWidgetRouteSpy;
  var onChangeRouteSpy;

  beforeAll(function () {
    editorModel = new Backbone.Model({
      edition: false
    });

    widgetDefinitionsCollection = {
      trigger: jasmine.createSpy()
    };

    modals = {
      destroy: jasmine.createSpy()
    };

    handleModalsRouteSpy = jasmine.createSpy('handleModalsRouteSpy');
    handleAnalysesRouteSpy = jasmine.createSpy('handleAnalysesRouteSpy');
    handleWidgetRouteSpy = jasmine.createSpy('handleWidgetRouteSpy');

    onChangeRouteSpy = spyOn(Router, '_onChangeRoute');

    Router.init({
      modals: modals,
      editorModel: editorModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      handleModalsRoute: handleModalsRouteSpy,
      handleAnalysesRoute: handleAnalysesRouteSpy,
      handleWidgetRoute: handleWidgetRouteSpy
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

    it('should handle widget route', function () {
      onChangeRouteSpy.and.callThrough();

      Router.navigate('/widget/widget-1337');

      var routeModel = Router.getRouteModel().get('currentRoute');

      expect(handleWidgetRouteSpy).toHaveBeenCalledWith(routeModel, widgetDefinitionsCollection);
    });
  });
});
