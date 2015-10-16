describe('widget', function() {

  beforeEach(function() {
    this.datasource = jasmine.createSpyObj('Datasource', ['addWidgetModel']);
    this.datasource.addWidgetModel.and.returnValue(new cdb.core.Model());
    this.view = new cdb.geo.ui.Widget.View({
      datasource: this.datasource
    });
    // spyOn(this.view.dataModel, 'bind');
    // spyOn(this.view.dataModel, 'unbind');
    // spyOn(this.view.viewModel, 'bind');
    // spyOn(this.view.viewModel, 'unbind');
  });

  it('should not have bindings when view is cleaned', function() {
    this.view.clean();
    // debugger;
    // console.log(this.view.dataModel.bind);
    // console.log(this.view.viewModel.bind.calls);
  });

  afterEach(function() {

  });

});
