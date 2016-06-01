var Infobox = require('../../../../../javascripts/cartodb3/components/infobox/infobox-view');
var InfoboxCollection = require('../../../../../javascripts/cartodb3/components/infobox/infobox-states-collection');

describe('editor/components/infobox-view', function () {
  var view;

  beforeEach(function () {
    this.collection = new InfoboxCollection([{
      state: 'ready',
      title: 'Ready',
      primaryButton: {
        type: 'link',
        label: 'Confirm',
        action: function () {}
      },
      secondaryButton: {
        type: 'button',
        label: 'View',
        action: function () {}
      }
    }, {
      state: 'error',
      title: 'Oops',
      primaryButton: false
    }]);

    view = new Infobox({
      statesCollection: this.collection
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.Infobox')).toBeDefined();
    expect(view.$('a').length).toBe(1);
    expect(view.$('button').length).toBe(1);

    this.collection.setSelected('error');

    expect(view.$('a').length).toBe(0);
    expect(view.$('button').length).toBe(0);
  });

  it('should bind actions properly', function () {
    var model = this.collection.getSelected();

    spyOn(model.get('primaryButton'), 'action');
    spyOn(model.get('secondaryButton'), 'action');

    view.$('.js-primary .js-action').trigger('click');
    expect(model.get('primaryButton').action).toHaveBeenCalled();

    view.$('.js-secondary .js-action').trigger('click');
    expect(model.get('secondaryButton').action).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
