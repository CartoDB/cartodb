describe('widgets/content_view', function() {

  beforeEach(function() {
    this.dataModel = new cdb.geo.ui.Widget.Model({
      id: 'widget_3',
      options: {
        title: 'Howdy',
        columns: ['cartodb_id', 'title']
      }
    });
    this.viewModel = new cdb.core.Model({
      sync: true
    });

    spyOn(this.dataModel, 'once').and.callThrough();
    spyOn(this.dataModel, 'bind').and.callThrough();
    spyOn(this.dataModel, 'unbind').and.callThrough();
    spyOn(this.viewModel, 'bind').and.callThrough();

    this.view = new cdb.geo.ui.Widget.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  });

  it('should have a binds from the beginning', function() {
    expect(this.viewModel.bind.calls.argsFor(0)[0]).toEqual('change:sync');
    expect(this.dataModel.once.calls.argsFor(0)[0]).toEqual('error change:data');
    expect(this.dataModel.bind.calls.count()).toEqual(0);
    expect(this.dataModel.unbind.calls.count()).toEqual(0);
  });

  describe('sync', function(){
    beforeEach(function() {
      this.view.render();
    });

    it('should set binds if sync option is true', function() {
      this.dataModel.trigger('change:data');
      expect(this.dataModel.unbind.calls.count()).toEqual(1);
      expect(this.dataModel.bind.calls.argsFor(0)[0]).toEqual('change:data');
      expect(this.dataModel.bind.calls.count()).toEqual(1);
    });

    it('should not set binds if sync option is false', function() {
      this.dataModel.trigger('change:data');
      this.viewModel.set('sync', false);
      expect(this.dataModel.unbind.calls.count()).toEqual(2);
      expect(this.dataModel.bind.calls.count()).toEqual(1);
    });
  });

  describe('render', function() {

    it('should render placeholder when data is empty', function(){
      spyOn(this.view, '_addPlaceholder');
      this.dataModel.set('data', '');
      expect(this.view._addPlaceholder).toHaveBeenCalled();
    });
  });

});
