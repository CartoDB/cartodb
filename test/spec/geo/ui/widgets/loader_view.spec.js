describe('widgets/loader_view', function() {

  beforeEach(function() {
    this.model = new cdb.geo.ui.Widget.Model({
      id: 'widget_1',
      title: 'Hello widget',
      columns: ['cartodb_id', 'description']
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new cdb.geo.ui.Widget.Loader({
      model: this.model
    });
  });

  it('should have render correctly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('Widget-loader')).toBeTruthy();
  });

  it('should have a binds from the beginning', function() {
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('loading');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('sync error');
  });

  describe('visibility', function() {
    beforeEach(function() {
      this.view.render();
    });

    it('should remove is-visible class when element isn\'t showed', function() {
      this.view.hide();
      expect(this.view.$el.hasClass('is-visible')).toBeFalsy();
    });

    it('should add is-visible class when element is showed', function() {
      this.view.show();
      expect(this.view.$el.hasClass('is-visible')).toBeTruthy();
    });
  });

});
