var _ = require('underscore');
var Backbone = require('backbone');
var InputRampListView = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-ramps/input-ramp-list-view');
var rampList = require('../../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-ramps/ramps');

describe('components/form-components/editors/fill/input-color/input-ramps/input-ramp-list-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      bins: 7,
      range: ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
      attribute: 'column1',
      quantification: 'jenks'
    });

    this.view = new InputRampListView(({
      model: this.model
    }));

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-listItem').length).toBe(_.toArray(rampList).length);
    expect(this.view.$('.is-selected').parent().data('val')).toContain('#F1EEF6,#D4B9DA,#C994C7,#DF65B0,#E7298A,#CE1256,#91003F');
  });

  it('should select ramp on click', function () {
    this.view.$('.js-listItem:eq(2)').click();
    var ramp = rampList.pink[7];
    expect(this.model.get('range').join(',')).toBe(ramp.join(','));
    expect(this.view.$('.is-selected').parent().data('val')).toContain(ramp);
    expect(this.view.$('.is-selected').length)).toBe(1);
  });

  afterEach(function () {
    this.view.remove();
  });
});
