var _ = require('underscore');
var Backbone = require('backbone');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-content-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerContentModel = require('../../../../../../javascripts/cartodb3/data/layer-content-model');
var analysisPlaceholderTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-placeholder.tpl');
var analysisSQLErrorTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-sql-error.tpl');
var actionErrorTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/sql-error-action.tpl');
var ScrollView = require('../../../../../../javascripts/cartodb3/components/scroll/scroll-view');
var AnalysisControlsView = require('../../../../../../javascripts/cartodb3/components/scroll/scroll-view');

describe('editor/layers/layer-content-view/analyses-content-view', function () {
  var view;
  var userActions;
  var analysisFormsCollection;
  var layerDefinitionModel;
  var analysisDefinitionNodesCollection;
  var overlayModel;
  var layerContentModel;
  var renderTooltipSpy;
  var renderSpy;
  var onLayerDefSourceChangedSpy;
  var setDefaultSelectedNodeIdSpy;
  var toggleOverlaySpy;
  var nodeA0;
  var nodeA1;
  var formA0;
  var formA1;

  var createViewFn = function (options) {
    var configModel = new ConfigModel({
      user_name: 'pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });
    spyOn(userModel, 'fetch');

    userActions = jasmine.createSpyObj('userActions', ['saveLayer']);

    overlayModel = new Backbone.Model({
      visible: false
    });

    analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    nodeA0 = analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo',
      query: 'SELECT * FROM table_name'
    });

    nodeA1 = analysisDefinitionNodesCollection.add({
      id: 'a1',
      type: 'trade-area',
      kind: 'walk',
      time: '100',
      source: 'a0'
    });

    layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      configModel: configModel,
      collection: new Backbone.Collection(),
      parse: true
    });
    layerDefinitionModel.findAnalysisDefinitionNodeModel = function (id) {
      switch (id) {
        case 'a0': return nodeA0;
        case 'a1': return nodeA1;
      }
    };

    analysisFormsCollection = new AnalysisFormsCollection(null, {
      configModel: configModel,
      userActions: userActions,
      layerDefinitionModel: layerDefinitionModel,
      analysisSourceOptionsModel: new Backbone.Model()
    });
    analysisFormsCollection.isEmpty = function () { return true; };

    layerContentModel = new LayerContentModel({}, {
      querySchemaModel: new Backbone.Model(),
      queryGeometryModel: new Backbone.Model(),
      queryRowsCollection: new Backbone.Collection()
    });
    layerContentModel.isErrored = function () { return false; };

    var defaultOptions = {
      userActions: userActions,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      analysisFormsCollection: analysisFormsCollection,
      layerDefinitionModel: layerDefinitionModel,
      userModel: userModel,
      configModel: configModel,
      stackLayoutModel: {},
      overlayModel: overlayModel,
      layerContentModel: layerContentModel
    };

    var view = new AnalysesContentView(_.extend(defaultOptions, options));

    renderTooltipSpy = spyOn(view, '_renderTooltip');

    return view;
  };

  beforeEach(function () {
    renderSpy = spyOn(AnalysesContentView.prototype, 'render');
    onLayerDefSourceChangedSpy = spyOn(AnalysesContentView.prototype, '_onLayerDefSourceChanged');
    setDefaultSelectedNodeIdSpy = spyOn(AnalysesContentView.prototype, '_setDefaultSelectedNodeId');
    toggleOverlaySpy = spyOn(AnalysesContentView.prototype, '_toggleOverlay');

    view = createViewFn();

    // spyOn(layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);
    // spyOn(layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
    //   switch (id) {
    //     case 'a0': return this.a0;
    //     case 'a1': return this.a1;
    //   }
    // }.bind(this));

    // analysisSourceOptionsModel = new Backbone.Model();
    // spyOn(analysisSourceOptionsModel, 'fetch');

    // view = new AnalysesContentView({
    //   userActions: userActions,
    //   analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    //   analysisFormsCollection: analysisFormsCollection,
    //   layerDefinitionModel: layerDefinitionModel,
    //   userModel: userModel,
    //   configModel: configModel,
    //   stackLayoutModel: {},
    //   overlayModel: overlayModel,
    //   layerContentModel: layerContentModel
    // });
  });

  describe('.render', function () {
    it('should render properly', function () {
      renderSpy.and.callThrough();

      spyOn(view, '_initViews');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
      expect(toggleOverlaySpy).toHaveBeenCalled();
    });

    it('should not have any leaks', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(view).toHaveNoLeaks();
    });

    describe('is errored', function () {
      it('should render error', function () {
        renderSpy.and.callThrough();
        view._isErrored = function () { return true; };
        spyOn(view, '_renderError');

        view.render();

        expect(view._renderError).toHaveBeenCalled();
      });
    });
  });

  describe('._isErrored', function () {
    it('should return if layer content model is errored', function () {
      expect(view._isErrored()).toBe(false);

      layerContentModel.isErrored = function () { return true; };

      expect(view._isErrored()).toBe(true);
    });
  });

  describe('._renderError', function () {
    it('should render error', function () {
      var template = analysisSQLErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      });
      spyOn(view.$el, 'html');

      view._renderError();

      expect(view.$el.html).toHaveBeenCalledWith(template);
    });
  });

  describe('._initViews', function () {
    it('should init views', function () {
      var template = analysisPlaceholderTemplate();
      spyOn(view.$el, 'html');

      view._initViews();

      expect(view.$el.html).toHaveBeenCalledWith(template);
      expect(renderTooltipSpy).toHaveBeenCalled();
    });

    describe('analysis forms collection is not empty', function () {
      it('should init views', function () {
        analysisFormsCollection.isEmpty = function () { return false; };

        var formModel = 'wadus';

        spyOn(view, '_getFormModel').and.returnValue(formModel);
        spyOn(view, '_renderScrollableListView');
        spyOn(view, '_renderControlsView');

        view._initViews();

        expect(view._renderScrollableListView).toHaveBeenCalledWith(formModel);
        expect(view._renderControlsView).toHaveBeenCalledWith(formModel);
      });
    });
  });

  describe('._toggleOverlay', function () {
    it('should toggle overlay', function () {
      toggleOverlaySpy.and.callThrough();
      expect(view.$el.hasClass('is-disabled')).toBe(false);

      overlayModel.set('visible', true, { silent: true });
      view._toggleOverlay();

      expect(view.$el.hasClass('is-disabled')).toBe(true);
    });
  });

  describe('_renderTooltip', function () {
    it('should renderTooltip', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(_.size(view._subviews)).toBe(0);

      renderTooltipSpy.and.callThrough();
      view._renderTooltip();

      expect(_.size(view._subviews)).toBe(1);
    });
  });

  describe('_initBinds', function () {
    it('should listen to viewModel change selectedNodeId', function () {
      view._viewModel.set('selectedNodeId', 0);

      expect(renderSpy).toHaveBeenCalled();
    });

    it('should listen to layerDefinitionModel change source', function () {
      layerDefinitionModel.set('source', 'a1');

      expect(onLayerDefSourceChangedSpy).toHaveBeenCalled();
    });

    it('should listen to analysisFormsCollection destroyedModels', function () {
      analysisFormsCollection.trigger('destroyedModels');

      expect(setDefaultSelectedNodeIdSpy).toHaveBeenCalled();
    });

    it('should listen to analysisFormsCollection remove', function () {
      analysisFormsCollection.reset([{}]);
      analysisFormsCollection.remove(analysisFormsCollection.at(0));

      expect(setDefaultSelectedNodeIdSpy).toHaveBeenCalled();
    });

    it('should listen to overlayModel change visible', function () {
      overlayModel.set('visible', true);

      expect(toggleOverlaySpy).toHaveBeenCalled();
    });
  });

  describe('_renderScrollableListView', function () {
    it('should render scrollable list view', function () {
      spyOn(ScrollView.prototype, 'render').and.returnValue(function () { return this; });

      view._renderScrollableListView();

      expect(_.size(view._subviews)).toBe(1); // ['ScrollView']
    });
  });

  describe('_renderControlsView', function () {
    it('should render constrols view', function () {
      spyOn(AnalysisControlsView.prototype, 'render').and.returnValue(function () { return this; });

      var formModel = new Backbone.Model({
        id: 'wadus',
        type: 'type'
      });

      view._renderControlsView(formModel);

      expect(_.size(view._subviews)).toBe(1); // ['AnalysisControlsView']
    });
  });

  describe('_getFormModel', function () {
    afterEach(function () {
      analysisFormsCollection.reset([]);
    });

    it('should get form model', function () {
      formA0 = analysisFormsCollection.add(nodeA0.attributes);

      view = createViewFn({
        analysisFormsCollection: analysisFormsCollection
      });

      expect(view._getFormModel()).toBe(formA0);
    });

    describe('with selectedNodeId', function () {
      it('should get form model', function () {
        formA0 = analysisFormsCollection.add(nodeA0.attributes);
        formA1 = analysisFormsCollection.add(nodeA1.attributes);

        view = createViewFn({
          selectedNodeId: formA1.get('id'),
          analysisFormsCollection: analysisFormsCollection
        });

        expect(view._getFormModel()).toBe(formA1);
      });
    });
  });

  describe('_getQuerySchemaModelForEstimation', function () {
    it('should get QuerySchemaModel', function () {

    });
  });

  describe('_setSelectedNodeId', function () {
    it('should set SelectedNodeId', function () {

    });
  });

  describe('_getSelectedNodeId', function () {
    it('should get SelectedNodeId', function () {

    });
  });

  describe('_onLayerDefSourceChanged', function () {
    it('should remove models from the analysis forms collection', function () {

    });
  });

  describe('_setDefaultSelectedNodeId', function () {
    it('should set default SelectedNodeId', function () {

    });
  });

  // describe('when a new node is added to layer definition', function () {
  //   beforeEach(function () {
  //     this.a1 = new AnalysisDefinitionNodeModel({
  //       id: 'a1',
  //       type: 'trade-area',
  //       kind: 'walk',
  //       time: '100',
  //       source: 'a0'
  //     }, {
  //       configModel: this.configModel,
  //       collection: new Backbone.Collection()
  //     });
  //     this.layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(this.a1);
  //     spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);
  //     var newNodeModel = this.analysisFormsCollection.add(this.a1.attributes, {at: 0});
  //     newNodeModel.getColor = function () {};
  //     view._renderWithDefaultNodeSelected();

  //     this.layerDefinitionModel.set('source', 'a1');
  //   });

  //   it('should render workflow and analysis form views', function () {
  //     expect(view.$el.html()).not.toContain('placeholder-text');
  //   });

  //   it('should have a add-analysis button', function () {
  //     expect(view.$el.html()).toContain('js-add-analysis');
  //     expect(view.$('.js-add-analysis').length).toEqual(1);
  //     expect(view.$('.js-add-analysis').data('layer-id')).toEqual('l-1');
  //   });

  //   it('should use default selection (head)', function () {
  //     expect(view._viewModel.get('selectedNodeId')).toEqual('a1');
  //   });

  //   describe('when there is no corresponding analysis yet (e.g. form representing new item)', function () {
  //     beforeEach(function () {
  //       this.analysisDefinitionNodesCollection.reset([]);
  //       this.layerDefinitionModel.set('source', 'a0', { silent: true });
  //       this.layerDefinitionModel.set('source', 'a1');
  //     });

  //     it('should use form as fallback model', function () {
  //       expect(view.$el.html()).toContain('a1'); // should not throw any error
  //     });
  //   });
  // });

  // describe('when a new form model is added', function () {
  //   beforeEach(function () {
  //     this.analysisFormsCollection.addHead({
  //       id: 'a1',
  //       type: 'buffer',
  //       source: 'a0'
  //     });
  //     view._renderWithDefaultNodeSelected();
  //   });

  //   it('should select new node', function () {
  //     expect(view._viewModel.get('selectedNodeId')).toEqual('a1');
  //   });

  //   it('should render form', function () {
  //     expect(view.$el.html()).toContain('a1');
  //   });
  // });
});
