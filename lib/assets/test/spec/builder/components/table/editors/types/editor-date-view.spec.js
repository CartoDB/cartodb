var Backbone = require('backbone');
var EditorDateView = require('builder/components/table/editors/types/editor-date-view');

describe('components/table/editors/types/editor-date-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      value: '2016-12-01T00:00:00+02:00'
    });
    this.editorModel = jasmine.createSpyObj('editorModel', ['confirm']);
    this.view = new EditorDateView({
      model: this.model,
      editorModel: this.editorModel
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.Editor-fieldset').length).toBe(1);
    expect(this.view.$('.Editor-formSelect').length).toBe(1);
    expect(this.view.$('.CDB-InputText').length).toBe(4);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
