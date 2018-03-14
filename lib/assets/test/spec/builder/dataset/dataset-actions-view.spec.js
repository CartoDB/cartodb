var _ = require('underscore');
var Backbone = require('backbone');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var DatasetActionsView = require('builder/dataset/dataset-options/dataset-actions-view');

describe('dataset/dataset-actions-view', function () {
  var view;
  var configModel;
  var queryGeometryModel;

  var createViewFn = function (options) {
    var defaultOptions;

    configModel = new Backbone.Model({});

    queryGeometryModel = new QueryGeometryModel({
      ready: true
    }, {
      configModel: configModel
    });

    defaultOptions = {
      previewAction: function () {},
      queryGeometryModel: queryGeometryModel,
      mapAction: function () {}
    };

    return new DatasetActionsView(_.extend(defaultOptions, options));
  };

  beforeEach(function () {
    view = createViewFn();
  });

  afterEach(function () {
    view.clean();
  });

  describe('.render', function () {
    it('should have no leaks', function () {
      expect(view).toHaveNoLeaks();
    });

    it('should render properly if it has geometry', function () {
      view._viewState.set('hasGeometry', true);
      view.render();

      expect(view.$el.html()).toContain('dataset.preview-map.preview');
      expect(view.$el.html()).toContain('dataset.create-map.title');
    });

    it('should render properly if it does not have geometry', function () {
      view._viewState.set('hasGeometry', false);
      view.render();

      expect(view.$el.html()).not.toContain('dataset.preview-map.preview');
      expect(view.$el.html()).toContain('dataset.create-map.title');
    });
  });

  describe('.initialize', function () {
    it('should call _setViewState when it is created', function () {
      spyOn(DatasetActionsView.prototype, '_setViewState').and.callThrough();

      view = createViewFn();

      expect(view._viewState).toBeDefined();
      expect(view._viewState.get('hasGeometry')).toBeDefined();
      expect(DatasetActionsView.prototype._setViewState).toHaveBeenCalled();
    });
  });

  describe('._onCreateMap', function () {
    it('should call to _onCreateMap to be binded', function () {
      view.render();

      spyOn(view, '_mapAction').and.callThrough();

      view.$('.js-createMap').click();
      expect(view._mapAction).toHaveBeenCalled();
    });
  });

  describe('._onPreviewMap', function () {
    it('should call to _previewAction to be binded', function () {
      view.render();

      spyOn(view, '_previewAction').and.callThrough();

      view.$('.js-previewMap').click();
      expect(view._previewAction).toHaveBeenCalled();
    });
  });

  describe('._setViewState', function () {
    describe('when geometry model has value', function () {
      beforeEach(function () {
        view.render();
        spyOn(view, 'render');
      });

      it('should update _hasGeometry if it works', function (done) {
        view._viewState.set('hasGeometry', false);

        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(true));

        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('hasGeometry')).toEqual(true);
          done();
        });
      });

      it('should set _hasGeometry to false if it fails', function (done) {
        view._viewState.set('hasGeometry', true);

        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.reject());

        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('hasGeometry')).toEqual(false);
          done();
        });
      });
    });
  });
});
