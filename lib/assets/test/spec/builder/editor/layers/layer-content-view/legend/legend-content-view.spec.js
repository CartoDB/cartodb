var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LegendContentView = require('builder/editor/layers/layer-content-views/legend/legend-content-view');
var LegendColorTypes = require('builder/editor/layers/layer-content-views/legend/color/legend-color-types');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LegendDefinitionCollection = require('builder/data/legends/legend-definitions-collection');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var FactoryModals = require('../../../../factories/modals');
var CategoryFormModel = require('builder/editor/layers/layer-content-views/legend/form/legend-category-definition-form-model');
var StyleModel = require('builder/editor/style/style-definition-model');
var StyleConstants = require('builder/components/form-components/_constants/_style');

describe('editor/layers/layer-content-view/legend/legend-content-view', function () {
  var legendType = {
    color: 'color',
    none: 'none',
    category: 'category'
  };

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.layerDefinitionModel.styleModel = new StyleModel({
      type: StyleConstants.Type.SIMPLE,
      fill: {
        color: {
          fixed: '#892b27'
        }
      }
    });

    var layerDefinitionsCollection = new Backbone.Collection();
    layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionCollection(null, {
      configModel: this.configModel,
      layerDefinitionsCollection: layerDefinitionsCollection,
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    this.legendDefinitionModel = new Backbone.Model({
      type: legendType.none
    }, {
      layerDefinitionModel: this.layerDefinitionModel,
      configModel: this.configModel,
      vizId: 'v-123'
    });
    this.legendDefinitionModel.setAttributes = jasmine.createSpy();

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };

    function updateLegend () { }

    this.view = new LegendContentView({
      overlayModel: new Backbone.Model(),
      legendTypes: LegendColorTypes,
      updateLegend: updateLegend,
      editorModel: this.editorModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionModel: this.legendDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      type: legendType.color,
      userModel: this.userModel,
      configModel: this.configModel,
      modals: FactoryModals.createModalService()
    });

    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(this.view._carouselCollection.length).toBe(2); // none and custom
      expect(_.size(this.view._subviews)).toBe(1); // [Carousel]
      expect(this.view.$('.js-carousel').children().length).toBe(1);
      expect(this.view.$('.js-form').children().length).toBe(0);

      this.view._carouselCollection.at(1).set({ selected: true });
      expect(_.size(this.view._subviews)).toBe(2); // [Carousel, FormView]
      expect(this.view.$('.js-form').children().length).toBe(1);

      // Clean the form view when type is none
      this.view._carouselCollection.at(0).set({ selected: true });
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.js-form').children().length).toBe(0);
    });
  });

  describe('.initBinds', function () {
    it('should call _onCarouselChange when _carouselCollection:selected changes', function () {
      spyOn(this.view, '_onCarouselChange');
      this.view._initBinds();
      this.view._carouselCollection.at(1).set({ selected: true });

      expect(this.view._onCarouselChange).toHaveBeenCalled();
    });
  });

  describe('._initViews', function () {
    it('should call ._renderCarousel', function () {
      spyOn(this.view, '_renderCarousel');

      this.view._initViews();

      expect(this.view._renderCarousel).toHaveBeenCalled();
    });

    it('should call ._renderForm', function () {
      spyOn(this.view, '_renderForm');

      this.view._initViews();

      expect(this.view._renderForm).toHaveBeenCalledWith(legendType.none);
    });

    it('should call ._updateToggle', function () {
      spyOn(this.view, '_updateToggle');

      this.view._initViews();

      expect(this.view._updateToggle).toHaveBeenCalledWith(legendType.none);
    });
  });

  describe('._onCarouselChange', function () {
    it('should call the proper functions', function () {
      spyOn(this.view, '_updateLegendModel');
      spyOn(this.view, '_createFormModel');
      spyOn(this.view, '_renderForm');
      spyOn(this.view, '_updateToggle');

      var model = this.view._carouselCollection.at(1);

      this.view._onCarouselChange(model);
      expect(this.view._updateLegendModel).not.toHaveBeenCalled();
      expect(this.view._createFormModel).not.toHaveBeenCalled();
      expect(this.view._renderForm).not.toHaveBeenCalled();
      expect(this.view._updateToggle).not.toHaveBeenCalled();

      model.set({ selected: true }, { silent: true });

      this.view._onCarouselChange(model);
      expect(this.view._updateLegendModel).toHaveBeenCalled();
      expect(this.view._createFormModel).toHaveBeenCalled();
      expect(this.view._renderForm).toHaveBeenCalled();
      expect(this.view._updateToggle).toHaveBeenCalled();
    });
  });

  describe('._createFormModel', function () {
    it('should unbind FormModel if exists', function () {
      var formModel = {};
      this.view._formModel = formModel;
      spyOn(this.view, '_unBindFormModel');

      this.view._createFormModel();
      expect(this.view._unBindFormModel).toHaveBeenCalledWith(formModel);
    });

    it('should not unbind FormModel if doesn\'t exist', function () {
      spyOn(this.view, '_unBindFormModel');

      this.view._createFormModel();
      expect(this.view._unBindFormModel).not.toHaveBeenCalled();
    });

    it('should create a new FormModel when type exists and not equal to "none"', function () {
      spyOn(this.view, '_bindFormModel');
      this.view._createFormModel(legendType.category);
      expect(this.view._formModel instanceof CategoryFormModel).toBe(true);
      expect(this.view._bindFormModel).toHaveBeenCalledWith(this.view._formModel);
    });

    it('should not create a new FormModel when type is not defined or equal to "none"', function () {
      spyOn(this.view, '_bindFormModel');
      this.view._createFormModel(legendType.none);
      expect(this.view._formModel).not.toBeDefined();
    });
  });

  describe('._updateLegendModel', function () {
    var defaultAttrs = { default: 'attributes' };
    var newLegendModel = new Backbone.Model();

    beforeEach(function () {
      spyOn(LegendFactory, 'enableLegend');
      spyOn(LegendFactory, 'createLegend').and.returnValue(newLegendModel);
      spyOn(LegendFactory, 'disableLegend');
      spyOn(LegendFactory, 'removeLegend');
      spyOn(this.view, '_updateLegend');
      spyOn(this.view, '_getDefaultAttributes').and.returnValue(defaultAttrs);
    });

    it('should assign type value to this.lastType', function () {
      this.view._lastType = null;

      this.view._updateLegendModel('bubble');

      expect(this.view._lastType).toBe('bubble');
    });

    describe('when type is not none', function () {
      beforeEach(function () {
        this.view._updateLegendModel('bubble');
      });

      it('should call LegendFactory.enableLegend', function () {
        expect(LegendFactory.enableLegend).toHaveBeenCalledWith(this.view._type);
      });

      it('should call LegendFactory.createLegend', function () {
        expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, 'bubble', defaultAttrs);
      });

      it('should call ._updateLegend', function () {
        expect(this.view._updateLegend).toHaveBeenCalledWith(newLegendModel);
      });
    });

    describe('when there is no type or is none', function () {
      it('should call LegendFactory.disableLegend', function () {
        this.view._updateLegendModel('none');
        expect(LegendFactory.disableLegend).toHaveBeenCalledWith('none');

        this.view._updateLegendModel(null);
        expect(LegendFactory.disableLegend).toHaveBeenCalledWith(null);
      });

      it('should call LegendFactory.removeLegend', function () {
        this.view._updateLegendModel('none');
        expect(LegendFactory.removeLegend).toHaveBeenCalled();

        this.view._updateLegendModel(null);
        expect(LegendFactory.removeLegend).toHaveBeenCalled();
      });

      it('should call ._updateLeged', function () {
        this.view._updateLegendModel('none');
        expect(this.view._updateLegend).toHaveBeenCalledWith(null);

        this.view._updateLegendModel(null);
        expect(this.view._updateLegend).toHaveBeenCalledWith(null);
      });

      it('should delete this._legendDefinitionModel', function () {
        this.view._legendDefinitionModel = 'legendDefinitionModel';

        this.view._updateLegendModel(null);

        expect(this.view._legendDefinitionModel).not.toBeDefined();
      });
    });
  });

  describe('._renderForm', function () {
    it('should call ._removeForm', function () {
      spyOn(this.view, '_removeForm');
      this.view._renderForm();
      expect(this.view._removeForm).toHaveBeenCalled();
    });

    it('should call ._addForm if type is defined and not "none"', function () {
      spyOn(this.view, '_addForm');
      this.view._renderForm(legendType.color);
      expect(this.view._addForm).toHaveBeenCalled();
    });

    it('should not call ._addForm if there is no type or type is none', function () {
      spyOn(this.view, '_addForm');
      this.view._renderForm();
      expect(this.view._addForm).not.toHaveBeenCalled();
    });
  });

  describe('._updateToggle', function () {
    it('should set editorModel:disabled true if type is "none"', function () {
      this.view._updateToggle(legendType.none);
      expect(this.view._editorModel.get('disabled')).toBe(true);
    });

    it('should set editorModel:disabled false if type is not "none"', function () {
      this.view._updateToggle(legendType.color);
      expect(this.view._editorModel.get('disabled')).toBe(false);
    });
  });

  describe('._updateChanges', function () {
    beforeEach(function () {
      spyOn(LegendFactory, 'createLegend');
      this.view._formModel = new Backbone.Model();
    });

    it('should call _legendDefinitionModel.setAttributes if _legendDefinitionModel is defined', function () {
      this.view._updateChanges();
      expect(this.legendDefinitionModel.setAttributes).toHaveBeenCalled();
    });

    it('should call LegendFactory.createLegend if _legendDefinitionModel is defined', function () {
      this.view._updateChanges();
      expect(LegendFactory.createLegend).toHaveBeenCalledWith(this.layerDefinitionModel, this.legendDefinitionModel.get('type'));

      LegendFactory.createLegend.calls.reset();
      this.view._legendDefinitionModel = undefined;

      this.view._updateChanges();
      expect(LegendFactory.createLegend).not.toHaveBeenCalled();
    });
  });

  it('should render the "apply" button properly in advanced mode', function () {
    this.view.$('.Options-bar .CDB-Toggle.js-input').click();
    expect(this.view.$('.js-apply').hasClass('.CDB-Size-small')).toBeFalsy();
  });

  describe('carousel', function () {
    it('should render carousel styleModel for points based', function () {
      this.layerDefinitionModel.styleModel = new StyleModel({
        type: StyleConstants.Type.SIMPLE,
        fill: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () { },
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color',
        userModel: this.userModel,
        configModel: this.configModel,
        modals: FactoryModals.createModalService()
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'choropleth', 'custom']);
    });

    it('should render carousel styleModel for lines based', function () {
      this.layerDefinitionModel.styleModel = new StyleModel({
        type: StyleConstants.Type.SIMPLE,
        stroke: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () { },
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color',
        userModel: this.userModel,
        configModel: this.configModel,
        modals: FactoryModals.createModalService()
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'choropleth', 'custom']);
    });

    it('should render category legend option in the carousel if styleModel has quantification category', function () {
      this.layerDefinitionModel.styleModel = new StyleModel({
        type: StyleConstants.Type.SIMPLE,
        fill: {
          color: {
            attribute: 'n_anclajes',
            attribute_type: 'number',
            quantification: 'category'
          }
        }
      });

      var view = new LegendContentView({
        overlayModel: new Backbone.Model(),
        legendTypes: LegendColorTypes,
        updateLegend: function () { },
        editorModel: this.editorModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionModel: this.legendDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        type: 'color',
        userModel: this.userModel,
        configModel: this.configModel,
        modals: FactoryModals.createModalService()
      });

      view.render();

      expect(view._carouselCollection.pluck('val')).toEqual(['none', 'category', 'custom']);
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
