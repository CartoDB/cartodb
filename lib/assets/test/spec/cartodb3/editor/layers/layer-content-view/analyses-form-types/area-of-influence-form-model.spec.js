var cdb = require('cartodb.js');
var _ = require('underscore');
var AreaOfInfluenceFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/area-of-influence/area-of-influence-form-model');

describe('editor/layers/layer-content-views/analyses-form-types/area-of-influence-form-model', function () {
  beforeEach(function () {
    // "Removed" debounce for not conflict with tests
    spyOn(_, 'debounce').and.callFake(function (func) {
      return func;
    });

    this.analysisDefinitionNodeModel = new cdb.core.Model({
      type: 'buffer',
      id: 'hello'
    });
    this.model = new AreaOfInfluenceFormModel({
      type: 'buffer'
    }, {
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });
  });

  it('should add analysis schema', function () {
    expect(this.model.schema).not.toBeUndefined();
  });

  describe('when for mmodel is created for a buffer with a particular distance', function () {
    beforeEach(function () {
      this.model = new AreaOfInfluenceFormModel({
        type: 'buffer',
        distance: 'kilometers',
        radius: 1000
      }, {
        analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
      });
    });

    it('should adjust radius for given distance magnitude', function () {
      expect(this.model.get('radius')).toEqual(1);
    });
  });

  describe('on update', function () {
    beforeEach(function () {
      spyOn(this.analysisDefinitionNodeModel, 'set').and.callThrough();
      spyOn(this.model, 'trigger').and.callThrough();
    });

    describe('on params change', function () {
      it('should just update analysis definition node model', function () {
        this.model.set('radius', 101);
        expect(this.analysisDefinitionNodeModel.set).toHaveBeenCalled();
        expect(this.analysisDefinitionNodeModel.get('radius')).toBe(101);
      });
    });

    describe('on type change', function () {
      beforeEach(function () {
        spyOn(this.model, '_setDefaults').and.callThrough();
        spyOn(this.model, 'unbind').and.callThrough();
        this.model.set('type', 'trade-area');
      });

      it('should change analysis type', function () {
        expect(this.analysisDefinitionNodeModel.get('type')).toBe('trade-area');
      });

      it('should set defaults', function () {
        expect(this.model._setDefaults).toHaveBeenCalled();
      });

      it('should remove previous params', function () {
        expect(this.model.get('radius')).toBeUndefined();
        expect(this.analysisDefinitionNodeModel.get('radius')).toBeUndefined();
        expect(this.model.get('distance')).toBeUndefined();
        expect(this.analysisDefinitionNodeModel.get('distance')).toBeUndefined();
      });

      it('should remove previous binds', function () {
        expect(this.model.unbind).toHaveBeenCalled();
      });

      it('should send a trigger of schema change', function () {
        expect(this.model.trigger).toHaveBeenCalledWith('changeSchema', this.model);
      });
    });
  });
});
