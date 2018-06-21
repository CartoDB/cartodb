var Backbone = require('backbone');
var TabPaneRadioLabelView = require('builder/components/tab-pane/tab-pane-radio-label-view');

describe('components/tab-pane-radio-label-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      name: 'first',
      label: 'My first label'
    });

    this.view = new TabPaneRadioLabelView({
      model: this.model
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render', function () {
    var label = this.view.$el.find('label');
    expect(label.length).toBe(1);
    expect(label.text().trim()).toBe(this.model.get('label'));
    expect(this.view.$el.find('input:radio').length).toBe(1);
  });

  it('should have checked input just when selected', function () {
    var radio = this.view.$el.find('input');
    expect(radio.prop('checked')).toBe(false);

    this.model.set('selected', true);
    this.view.render();
    radio = this.view.$el.find('input');
    expect(radio.prop('checked')).toBe(true);
  });
});
