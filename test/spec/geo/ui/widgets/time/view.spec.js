var TimeWidgetModel = require('cdb/geo/ui/widgets/time/model');
var TimeWidgetView = require('cdb/geo/ui/widgets/time/view');

describe('geo/ui/widgets/time/view', function() {
  beforeEach(function() {
    this.model = new TimeWidgetModel({
    });
    this.view = new TimeWidgetView({
      model: this.model
    });
    this.view.render();
  });

  it('should render', function() {
    expect(this.view.$el.html()).not.toEqual('');
  });

  it('should not render chart just yet since have no data', function() {
    expect(this.view.$el.html()).not.toContain('<svg');
  });
});
