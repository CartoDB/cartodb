var _ = require('underscore');
var Backbone = require('backbone');
var DataSQLModel = require('builder/dataset/data-sql-model');
var EditorModel = require('builder/data/editor-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var DatasetActionsEditionView = require('builder/dataset/dataset-options/dataset-actions-edition-view');

describe('dataset/dataset-actions-edition-view', function () {
  var view;
  var configModel;
  var clearSQLModel;
  var trackModel;
  var editorModel;
  var queryGeometryModel;
  var querySchemaModel;
  var onApply;
  var onClear;
  var previewAction;
  var mapAction;

  var createViewFn = function (options) {
    var defaultOptions;

    var applyButtonStatusModel = new Backbone.Model({
      loading: false
    });

    configModel = new Backbone.Model({});

    clearSQLModel = new Backbone.Model({
      visible: false
    });

    trackModel = new DataSQLModel({
      content: ''
    }, {
      history: ''
    });

    editorModel = new EditorModel();

    queryGeometryModel = new QueryGeometryModel({
      ready: true
    }, {
      configModel: configModel
    });

    querySchemaModel = new QuerySchemaModel({
      status: 'fetched',
      query: 'SELECT * FROM table'
    }, {
      configModel: configModel
    });

    onApply = function () {};

    onClear = function () {};

    previewAction = function () {};

    mapAction = function () {};

    defaultOptions = {
      clearSQLModel: clearSQLModel,
      trackModel: trackModel,
      editorModel: editorModel,
      queryGeometryModel: queryGeometryModel,
      onApply: onApply,
      onClear: onClear,
      previewAction: previewAction,
      querySchemaModel: querySchemaModel,
      mapAction: mapAction,
      applyButtonStatusModel: applyButtonStatusModel
    };

    return new DatasetActionsEditionView(_.extend(defaultOptions, options));
  };

  beforeEach(function () {
    view = createViewFn();
  });

  afterEach(function () {
    view.clean();
  });

  describe('.initialize', function () {
    it('should call _initViewState when it is created', function () {
      spyOn(DatasetActionsEditionView.prototype, '_initViewState').and.callThrough();

      view = createViewFn();

      expect(DatasetActionsEditionView.prototype._initViewState).toHaveBeenCalled();
    });

    it('should listen on geometry model changes and call _setViewState', function () {
      spyOn(DatasetActionsEditionView.prototype, '_setViewState').and.callThrough();

      view = createViewFn();
      view._queryGeometryModel.set('status', 'changed');

      expect(DatasetActionsEditionView.prototype._setViewState).toHaveBeenCalled();
    });

    it('should listen on schema model changes and call _updateApplyLoadingButtonLoading', function () {
      spyOn(DatasetActionsEditionView.prototype, '_updateApplyLoadingButtonLoading').and.callThrough();

      view = createViewFn();
      view._querySchemaModel.set('status', 'changed');

      expect(DatasetActionsEditionView.prototype._updateApplyLoadingButtonLoading).toHaveBeenCalled();
    });
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
      view._viewState.set('hasGeom', false);
      view.render();

      expect(view.$el.html()).not.toContain('dataset.preview-map.preview');
      expect(view.$el.html()).toContain('dataset.create-map.title');
    });
  });

  describe('._initViews', function () {
    it('should add undo buttons properly', function () {
      view.render();

      expect(view.$('.js-undo').length).toEqual(1);
      expect(view.$('.js-redo').length).toEqual(1);
      expect(view.$('.js-clear').length).toEqual(0);
      expect(view.$('.js-apply').length).toEqual(0);
    });

    it('should add clear and apply buttons properly', function () {
      view._clearSQLModel.set('visible', true);
      view._editorModel.set('edition', true);

      view.render();

      expect(view.$('.js-clear').length).toEqual(1);
      expect(view.$('.js-apply').length).toEqual(1);
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

  describe('._updateApplyLoadingButtonLoading', function () {
    it('should set the apply button to loading if it is fetching', function () {
      spyOn(view._querySchemaModel, 'isFetching').and.returnValue(true);
      view._updateApplyLoadingButtonLoading();
      expect(view._applyButtonStatusModel.get('loading')).toEqual(true);
    });

    it('should not set the apply button to loading if it not is fetching', function () {
      spyOn(view._querySchemaModel, 'isFetching').and.returnValue(false);
      view._updateApplyLoadingButtonLoading();
      expect(view._applyButtonStatusModel.get('loading')).toEqual(false);
    });
  });

  describe('._setViewState', function () {
    describe('when geometry model has value', function () {
      it('should update _viewState', function (done) {
        spyOn(view._queryGeometryModel, 'hasValueAsync').and.returnValue(Promise.resolve(true));

        view._viewState.set('hasGeom', false, { silent: true });
        view._setViewState();

        setTimeout(function () {
          expect(view._viewState.get('hasGeom')).toEqual(true);
          done();
        });
      });
    });
  });
});
