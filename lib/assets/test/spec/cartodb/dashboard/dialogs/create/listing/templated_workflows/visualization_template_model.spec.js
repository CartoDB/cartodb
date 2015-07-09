var VisualizationTemplateModel = require('../../../../../../../../javascripts/cartodb/common/dialogs/create/listing/templated_workflows/visualization_template_model');


describe("templated_workflows/visualization_template_model", function() {

  beforeEach(function() {
    this.model = new VisualizationTemplateModel({
      code: '{}'
    });
  });  

  it("should validate from the beginning", function() {
    expect(this.model.getError()).not.toBe('');
  });

  it("should validate those attributes", function() {
    this.model.unset('code');
    expect(this.model.getError()).toContain('template code');
    
    this.model.set('code', '{}');
    expect(this.model.getError()).toContain("'onStepFinished' template");
    
    this.model.set('code', '{ onStepFinished: function(){} }');
    expect(this.model.getError()).toContain("'onWizardFinished' template function");

    this.model.set('code', '{ onStepFinished: function(){}, onWizardFinished: function(){} }');
    expect(this.model.getError()).toContain("'getStep' template function");

    this.model.set('code', '{ onStepFinished: function(){}, onWizardFinished: function(){}, getStep: function(){} }');
    expect(this.model.getError()).toContain("'getStepNames' template function");
  });

  it("should extend template code when it is changed and attributes are valid", function() {
    expect(this.model.onStepFinished).toBeUndefined();
    this.model.set({
      name: 'paco',
      code: '{ onStepFinished: function(){}, onWizardFinished: function(){}, getStep: function(){}, getStepNames: function(){} }'
    });
    expect(this.model.getError()).toBe('');
    expect(this.model.onStepFinished).not.toBeUndefined();
  });

  it("should return the error text when validation fails", function() {
    this.model.unset('code');
    expect(this.model.getError()).toContain('template code not provided');
  });

});