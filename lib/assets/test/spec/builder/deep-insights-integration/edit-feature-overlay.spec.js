var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureOverlay = require('builder/deep-insights-integration/edit-feature-overlay');
var MapModeModel = require('builder/map-mode-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FeatureDefinitionModel = require('builder/data/feature-definition-model');
var FactoryModals = require('../factories/modals');
var Router = require('builder/routes/router');

describe('deep-insights-integrations/edit-feature-overlay', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });
    this.layerDefinitionModel = layerDefinitionsCollection.at(0);

    this.featureDefinition = new FeatureDefinitionModel({
      cartodb_id: 50,
      the_geom: '{"type":"Polygon","coordinates":[[[0,0],[4,1],[3,2],[0,0]]]}'
    }, {
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      userModel: this.userModel
    });
    this.featureDefinition.fetch = function (opts) {
      opts.success();
    };

    spyOn(Router, 'navigate');

    var mapModeModel = new MapModeModel();

    this.view = new EditFeatureOverlay({
      map: new Backbone.Model(),
      mapModeModel: mapModeModel,
      modals: FactoryModals.createModalService()
    });
    spyOn(this.view, 'hide');
    spyOn(this.view, '_confirmStopEdition');

    this.view.setPosition({
      x: 300,
      y: 400
    });
    this.view.setFeatureDefinition(this.featureDefinition);
    this.view
      .render()
      .show();
  });

  it('should render correctly', function () {
    expect(this.view.$('.js-edit-feature').length).toBe(1);
  });

  describe('when click', function () {
    beforeEach(function () {
      spyOn(this.view._featureDefinition, 'isEditable').and.returnValue(true);
      this.view.render();
      this.view.$('.js-edit-feature').click();
    });

    it('should close', function () {
      expect(this.view.hide).toHaveBeenCalled();
    });

    it('should not launch modal', function () {
      expect(this.view._confirmStopEdition).not.toHaveBeenCalled();
    });

    it('should navigate', function () {
      expect(Router.navigate).toHaveBeenCalled();
    });
  });

  describe('when layer is editable', function () {
    beforeEach(function () {
      spyOn(this.view._featureDefinition, 'isEditable').and.returnValue(true);
      this.view.render();
    });

    it('should not be disabled', function () {
      expect(this.view.$('.js-edit-feature').hasClass('is-disabled')).toBe(false);
    });

    it('should not have tooltip', function () {
      expect(_.size(this.view._subviews)).toBe(0);
    });

    describe('when user is not owner and has write access', function () {
      beforeEach(function () {
        this.view.render();
      });

      it('should show tooltip', function () {
        expect(this.view.$('.js-edit-feature').hasClass('is-disabled')).toBe(false);
      });
    });

    describe('when feature is too big', function () {
      beforeEach(function () {
        this.view.MAX_VERTEXES = 1;

        this.view.$('.js-edit-feature').click();
      });

      it('should launch modal', function () {
        expect(this.view._confirmStopEdition).toHaveBeenCalled();
      });
    });
  });

  describe('when layer is not editable', function () {
    beforeEach(function () {
      spyOn(this.view._featureDefinition, 'isEditable').and.returnValue(false);
      this.view.render();
    });

    it('should be disabled', function () {
      expect(this.view.$('.js-edit-feature').hasClass('is-disabled')).toBe(true);
    });

    it('should have tooltip', function () {
      expect(_.size(this.view._subviews)).toBe(1);
    });

    describe('when layer has analysis', function () {
      beforeEach(function () {
        spyOn(this.view._featureDefinition, 'hasAnalyses').and.returnValue(true);
        this.view.render();
      });

      it('should show tooltip', function () {
        expect(this.view.$('.js-edit-feature').hasClass('t-hasAnalyses')).toBe(true);
      });
    });

    describe('when layer has custom SQL', function () {
      beforeEach(function () {
        spyOn(this.view._featureDefinition, 'isCustomQueryApplied').and.returnValue(true);
        this.view.render();
      });

      it('should show tooltip', function () {
        expect(this.view.$('.js-edit-feature').hasClass('t-isCustomQueryApplied')).toBe(true);
      });
    });

    describe('when layer is read-only', function () {
      beforeEach(function () {
        spyOn(this.view._featureDefinition, 'isReadOnly').and.returnValue(true);
        this.view.render();
      });

      it('should show tooltip', function () {
        expect(this.view.$('.js-edit-feature').hasClass('t-isReadOnly')).toBe(true);
      });
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
