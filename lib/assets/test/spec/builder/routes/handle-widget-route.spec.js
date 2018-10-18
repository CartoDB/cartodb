var handleWidgetRoute = require('builder/routes/handle-widget-route');

describe('routes/handleWidgetRoute', function () {
  it('should handle widget route', function () {
    const widgetDefinitionsCollection = {
      trigger: jasmine.createSpy('trigger')
    };

    handleWidgetRoute(['widget', 'somewidgetid', null, null], widgetDefinitionsCollection);

    expect(widgetDefinitionsCollection.trigger).toHaveBeenCalledWith('setSelected', 'somewidgetid');
  });
});
