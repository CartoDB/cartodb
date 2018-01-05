var _ = require('underscore');
var Backbone = require('backbone');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisFormsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var AnalysesContentView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-content-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerContentModel = require('../../../../../../javascripts/cartodb3/data/layer-content-model');
var analysisPlaceholderTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-placeholder.tpl');
var analysisSQLErrorTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-sql-error.tpl');
var actionErrorTemplate = require('../../../../../../javascripts/cartodb3/editor/layers/sql-error-action.tpl');

describe('editor/layers/layer-content-view/analyses-content-view', function () {
  var view;
  var userActions;
  var analysisFormsCollection;
  var layerDefinitionModel;
  var analysisSourceOptionsModel;
  var analysisDefinitionNodesCollection;
  var overlayModel;
  var layerContentModel;
  var renderTooltipSpy;
  var renderSpy;
  var onLayerDefSourceChangedSpy;
  var setDefaultSelectedNodeIdSpy;
  var toggleOverlaySpy;

  beforeEach(function () {
    var configModel = new ConfigModel({
      // base_url: '/u/pepe',
      // user_name: 'foo',
      // sql_api_template: 'foo',
      // api_key: 'foo'
    });

    overlayModel = new Backbone.Model({
      visible: false
    });

    var userModel = new UserModel({
      username: 'pepe',
      quota: {}
    }, {
      configModel: configModel
    });
    spyOn(userModel, 'fetch');

    analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.a0 = analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo',
      query: 'SELECT * FROM table_name'
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

    spyOn(layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);
    spyOn(layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
      switch (id) {
        case 'a0': return this.a0;
        case 'a1': return this.a1;
      }
    }.bind(this));

    analysisSourceOptionsModel = new Backbone.Model();
    spyOn(analysisSourceOptionsModel, 'fetch');

    userActions = jasmine.createSpyObj('userActions', ['saveLayer']);

    analysisFormsCollection = new AnalysisFormsCollection(null, {
      configModel: configModel,
      userActions: userActions,
      layerDefinitionModel: layerDefinitionModel,
      analysisSourceOptionsModel: analysisSourceOptionsModel
    });

    layerContentModel = new LayerContentModel({}, {
      querySchemaModel: new Backbone.Model(),
      queryGeometryModel: new Backbone.Model(),
      queryRowsCollection: new Backbone.Collection()
    });
    layerContentModel.isErrored = function () { return false; };

    renderSpy = spyOn(AnalysesContentView.prototype, 'render');
    onLayerDefSourceChangedSpy = spyOn(AnalysesContentView.prototype, '_onLayerDefSourceChanged');
    setDefaultSelectedNodeIdSpy = spyOn(AnalysesContentView.prototype, '_setDefaultSelectedNodeId');
    toggleOverlaySpy = spyOn(AnalysesContentView.prototype, '_toggleOverlay');

    view = new AnalysesContentView({
      userActions: userActions,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      analysisFormsCollection: analysisFormsCollection,
      layerDefinitionModel: layerDefinitionModel,
      userModel: userModel,
      configModel: configModel,
      stackLayoutModel: {},
      overlayModel: overlayModel,
      layerContentModel: layerContentModel
    });

    renderTooltipSpy = spyOn(view, '_renderTooltip');
  });

  describe('.render', function () {
    it('should render properly', function () {
      renderSpy.and.callThrough();

      spyOn(view, '_initViews');

      view.render();

      expect(view._initViews).toHaveBeenCalled();
      expect(toggleOverlaySpy).toHaveBeenCalled();
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

    });
  });

  describe('_renderControlsView', function () {
    it('should render constrols view', function () {

    });
  });

  describe('_getFormModel', function () {
    it('should get form model', function () {

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

  // describe('when layer has no analysis', function () {
  //   it('should show the add analysis button', function () {
  //     this.layerDefinitionModel.canBeGeoreferenced.and.returnValue(false);
  //     view.render();
  //     expect(view.$el.html()).toContain('js-add-analysis');
  //   });
  // });

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

  it('should not have any leaks', function () {
    renderSpy.and.callThrough();

    view.render();

    expect(view).toHaveNoLeaks();
  });
});
