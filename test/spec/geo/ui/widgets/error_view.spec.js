describe('widgets/error_view', function() {

  beforeEach(function() {
    this.dataModel = new cdb.geo.ui.Widget.Model({
      id: 'widget_98334',
      options: {
        title: 'Helloooo',
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

    this.view = new cdb.geo.ui.Widget.Error({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  });

  it('should have render correctly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('Widget-error')).toBeTruthy();
  });

  it('should have a binds from the beginning', function() {
    expect(this.viewModel.bind.calls.argsFor(0)[0]).toEqual('change:sync');
    expect(this.dataModel.once.calls.argsFor(0)[0]).toEqual('error');
    expect(this.dataModel.once.calls.argsFor(1)[0]).toEqual('change:data');
    expect(this.dataModel.bind.calls.count()).toEqual(0);
    expect(this.dataModel.unbind.calls.count()).toEqual(0);
  });

  it('should fetch again the data when refresh button is clicked', function(done) {
    spyOn(this.dataModel, 'fetch');
    this.view.render();
    this.view.show();
    var self = this;
    setTimeout(function() {
      self.view.$('.js-refresh').click();
      expect(self.dataModel.fetch).toHaveBeenCalled();
      done();
    }, 400);
  });

  describe('sync', function(){
    beforeEach(function() {
      this.view.render();
    });

    it('should set binds if sync option is true', function() {
      // Fake first load
      this.dataModel.trigger('change:data');
      // Due to sync is enabled from the beginning, loading and change:data
      // binds should be defined.
      expect(this.dataModel.unbind.calls.count()).toEqual(1);
      expect(this.dataModel.bind.calls.argsFor(0)[0]).toEqual('error');
      expect(this.dataModel.bind.calls.argsFor(1)[0]).toEqual('loading change:data');
      expect(this.dataModel.bind.calls.count()).toEqual(2);
    });

    it('should not set binds if sync option is false', function() {
      // Fake first load
      this.dataModel.trigger('change:data');
      // Change sync option
      this.viewModel.set('sync', false);
      expect(this.dataModel.unbind.calls.count()).toEqual(2);
      expect(this.dataModel.bind.calls.count()).toEqual(2);
    });
  });

  describe('visibility', function() {
    beforeEach(function() {
      this.view.render();
    });

    it('should remove is-visible class when element isn\'t showed', function(done) {
      var self = this;
      this.view.hide();
      expect(this.view.$el.hasClass('is-visible')).toBeFalsy();
      setTimeout(function() {
        expect(self.view.$el.css('display')).toBe('none');
        done();
      }, 550);
    });

    it('should add is-visible class when element is showed', function() {
      this.view.show();
      expect(this.view.$el.hasClass('is-visible')).toBeTruthy();
    });
  });

});
