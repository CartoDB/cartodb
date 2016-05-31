var Infobox = require('../../../../../javascripts/cartodb3/components/infobox/infobox-view');
var InfoboxModel = require('../../../../../javascripts/cartodb3/components/infobox/infobox-view-model');

describe('editor/components/infobox-view', function () {
  var view;

  beforeEach(function () {
    this.infoboxModel = new InfoboxModel({
      type: 'notice',
      show: true,
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
    });

    view = new Infobox({
      model: this.infoboxModel
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.Infobox')).toBeDefined();
    expect(view.$('a').length).toBe(1);
    expect(view.$('button').length).toBe(1);
  });

  it('should bind actions properly', function () {
    spyOn(this.infoboxModel.get('primaryButton'), 'action');
    spyOn(this.infoboxModel.get('secondaryButton'), 'action');

    view.$('.js-primary .js-action').trigger('click');
    expect(this.infoboxModel.get('primaryButton').action).toHaveBeenCalled();

    view.$('.js-secondary .js-action').trigger('click');
    expect(this.infoboxModel.get('secondaryButton').action).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
