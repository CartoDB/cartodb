var Model = require('cdb/core/model');
var TimeWidgetView = require('cdb/geo/ui/widgets/time/view');

describe('geo/ui/widgets/time/view', function() {
  beforeEach(function() {
    this.model = new Model({
    });
    this.view = new TimeWidgetView({
      model: this.model
    });
    this.view.render();
  });

  it('should render', function() {
    expect(this.view.$el.html()).not.toEqual('');
  });
});
