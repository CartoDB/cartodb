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

  it('should not render chart just yet since have no data', function() {
    expect(this.view.$el.html()).not.toContain('<svg');
  });

  describe('when data is changed', function() {
    beforeEach(function() {
      var endDate = new Date();
      var startDate = new Date(endDate.getTime() - 1000*60*60)
      this.model.set('data', [{
        freq: 123,
        start: startDate,
        end: endDate
      }]);
    });

    it('should render the chart view', function() {
      expect(this.view.$el.html()).toContain('<svg');
    });
  });
});
