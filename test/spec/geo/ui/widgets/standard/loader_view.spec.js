var WidgetModel = require('cdb/geo/ui/widgets/widget_model');
var WidgetLoaderView = require('cdb/geo/ui/widgets/standard/widget_loader_view');

describe('geo/ui/widgets/standard/widget_loader_view', function() {

  beforeEach(function() {
    this.model = new WidgetModel({
      id: 'widget_1',
      title: 'Hello widget',
      columns: ['cartodb_id', 'description']
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view = new WidgetLoaderView({
      model: this.model
    });
  });

  it('should have render correctly', function() {
    this.view.render();
    expect(this.view.$el.hasClass('CDB-Widget-loader')).toBeTruthy();
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
