describe('Legend HTML pane', function() {

  var view, model, table;

  beforeEach(function() {
    model = new cdb.geo.ui.LegendModel();
    dataLayer = new cdb.admin.CartoDBLayer({ name: 'test', id: 'test' });
    
    view = new cdb.admin.mod.LegendHTMLPane({
      el:     $('<div>'),
      model:  model,
      table:  dataLayer
    });
  });


  it("should render HTML editor", function() {
    view.render();
    expect(view.$('.CodeMirror').length).toBe(1);
    expect(view.codeEditor.getValue()).toBe('');
  });

  it("should apply a new template when items attribute change", function() {
    view.render();
    spyOn(view.codeEditor,'setValue');
    model.set('items', [ { value: '#343', type: 'color'} ]);
    expect(view.codeEditor.setValue).toHaveBeenCalled();
  });

  it("should apply a new template when type attribute change", function() {
    view.render();
    spyOn(view.codeEditor,'setValue');
    model.set('type', 'choropleth');
    expect(view.codeEditor.setValue).toHaveBeenCalled();
  });

});