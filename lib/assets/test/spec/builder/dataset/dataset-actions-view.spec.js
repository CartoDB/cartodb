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
      view._hasGeometry = true;
      view.render();

      expect(view.$el.html()).toContain('dataset.preview-map.preview');
      expect(view.$el.html()).toContain('dataset.create-map.title');
    });

    it('should render properly if it does not have geometry', function () {
      view._hasGeometry = false;
      view.render();

      expect(view.$el.html()).not.toContain('dataset.preview-map.preview');
      expect(view.$el.html()).toContain('dataset.create-map.title');
    });
  });

  describe('.initialize', function () {
    it('should call _renderIfHasGeometryChanges when it is created', function () {
      spyOn(DatasetActionsView.prototype, '_renderIfHasGeometryChanges').and.callThrough();

      view = createViewFn();

      expect(DatasetActionsView.prototype._renderIfHasGeometryChanges).toHaveBeenCalled();
    });

    it('should listen on geometry model changes and call _renderIfHasGeometryChanges', function () {
      spyOn(DatasetActionsView.prototype, '_renderIfHasGeometryChanges').and.callThrough();

      view = createViewFn();
      view._queryGeometryModel.set('status', 'changed');

      expect(DatasetActionsView.prototype._renderIfHasGeometryChanges).toHaveBeenCalled();
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

  describe('._renderIfHasGeometryChanges', function () {
    describe('when geometry model has value', function () {
      beforeEach(function () {
        view.render();
        spyOn(view, 'render');
      });

      it('should render and update _hasGeometry if geometry has changed', function (done) {
        view._hasGeometry = false;

        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(true));

        view._renderIfHasGeometryChanges();

        setTimeout(function () {
          expect(view._hasGeometry).toEqual(true);
          expect(view.render).toHaveBeenCalled();
          done();
        });
      });

      it('should neither render nor update _hasGeometry if geometry has not changed', function (done) {
        view._hasGeometry = false;

        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(false));

        view._renderIfHasGeometryChanges();

        setTimeout(function () {
          expect(view._hasGeometry).toEqual(false);
          expect(view.render).not.toHaveBeenCalled();
          done();
        });
      });
    });

    describe('when geometry model does not have value', function () {
      beforeEach(function () {
        view.render();
        spyOn(view, 'render');
      });

      it('should neither render nor update _hasGeometry', function (done) {
        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.reject(true));

        view._renderIfHasGeometryChanges();

        setTimeout(function () {
          expect(view.render).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
