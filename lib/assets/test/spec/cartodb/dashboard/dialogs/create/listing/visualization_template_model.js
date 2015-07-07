var VisualizationTemplateModel = require('../../../../../../../common/dialogs/create/listing/templated_workflows/visualization_template_model');


describe("Visualization template model", function() {

  beforeEach(function() {
    this.model = new VisualizationTemplateModel();
  });

  it("should initialize state model", function() {
    expect(this.model.state).toBeDefined();
  });

});