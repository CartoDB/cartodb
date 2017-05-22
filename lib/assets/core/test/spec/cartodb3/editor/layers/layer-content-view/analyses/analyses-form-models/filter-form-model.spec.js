var Backbone = require('backbone');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model', function () {
  beforeEach(function () {
    // var configModel = new ConfigModel({
    //   base_url: '/u/pepe',
    //   api_key: 'wadus',
    //   user_name: 'pepe'
    // });

    // this.analysisDefinitionNodesCollection = new Backbone.Collection();

    // this.a0 = new AnalysisDefinitionNodeSourceModel({
    //   id: 'a0',
    //   type: 'georeference-street-address',
    //   query: 'SELECT * FROM a_table'
    // }, {
    //   configModel: configModel,
    //   userModel: {},
    //   collection: this.analysisDefinitionNodesCollection
    // });
    // spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    // this.a1 = new AnalysisDefinitionNodeModel({
    //   id: 'a1',
    //   type: 'georeference-long-lat',
    //   source: 'a0'
    // }, {
    //   configModel: configModel,
    //   collection: this.analysisDefinitionNodesCollection
    // });

    // this.layerDefinitionModel = new LayerDefinitionModel(null, {
    //   configModel: configModel
    // });
    // spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
    //   switch (id) {
    //     case 'a0': return this.a0;
    //     case 'a1': return this.a1;
    //     default: return null;
    //   }
    // }.bind(this));

    // this.model = new GeoreferenceFormModel(this.a1.attributes, {
    //   analyses: analyses,
    //   configModel: configModel,
    //   layerDefinitionModel: this.layerDefinitionModel,
    //   analysisSourceOptionsModel: {},
    //   parse: true
    // });
  });

  it('should add analysis schema', function () {
    expect(this.model.schema).toBeDefined();
  });

  it('should have attributes set with defaults', function () {
    // expect(this.model.attributes).toEqual({
    //   id: 'a1',
    //   source: 'a0',
    //   type: 'georeference-long-lat',
    //   latitude: undefined,
    //   longitude: undefined
    // });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(4);
  });

  describe('type filter-category', function () {
    beforeEach(function () {
      this.model.set('type', 'filter-category');
    });

    it('should not include latitude and longitude', function () {
      // expect(this.model.get('latitude')).not.toBeDefined();
      // expect(this.model.get('longitude')).not.toBeDefined();
    });

    it('should include street_address_column', function () {
      // expect(this.model.get('street_address_column')).toBeDefined();
    });

    it('should have proper attributes', function () {
      // expect(this.model.attributes).toEqual({
      //   context: undefined,
      //   id: 'a1',
      //   source: 'a0',
      //   type: 'georeference-street-address',
      //   street_address_column: '',
      //   city: '',
      //   state: '',
      //   country: ''
      // });
    });

    it('should have generated form fields', function () {
      // expect(Object.keys(this.model.schema).length).toBe(7);

      // expect(this.model.schema.street_address_column).toBeDefined();
    });

    describe('result hide', function () {
      it('should have generated form fields', function () {
        // this.model.set('context', 'advance');

        // expect(Object.keys(this.model.schema).length).toBe(7);
        // expect(this.model.schema.street_address_column).not.toBeDefined();
        // expect(this.model.schema.street_address_template).toBeDefined();
      });

      it('should format street_address properly', function () {
        // spyOn(this.model._typeDef(), '_wrapInBraces').and.callThrough();

        // this.model.set('street_address_column', 'address');
        // this.model.set('context', 'advance');

        // expect(this.model._typeDef()._wrapInBraces).toHaveBeenCalledWith('address');
        // expect(this.model.get('street_address_template')).toBe('{{address}}');
      });
    });
  });
});
