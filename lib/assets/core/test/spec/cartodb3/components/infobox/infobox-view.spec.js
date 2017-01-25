var Infobox = require('../../../../../javascripts/cartodb3/components/infobox/infobox-factory');
var InfoboxView = require('../../../../../javascripts/cartodb3/components/infobox/infobox-view');
var InfoboxModel = require('../../../../../javascripts/cartodb3/components/infobox/infobox-model');
var InfoboxCollection = require('../../../../../javascripts/cartodb3/components/infobox/infobox-collection');

describe('components/infobox/infobox-view', function () {
  beforeEach(function () {
    var states = [
      {
        state: 'ready',
        createContentView: function () {
          return Infobox.createInfo({
            title: 'Info',
            body: 'Lorem ipsum dolor sit amet.'
          });
        }
      },
      {
        state: 'error',
        createContentView: function () {
          return Infobox.createConfirm({
            title: 'Error',
            body: 'Lorem ipsum dolor sit amet.',
            confirmLabel: 'Confirm',
            confirmPosition: 'right'
          });
        },
        mainAction: function () {}
      }
    ];

    this.model = new InfoboxModel({
      state: 'ready',
      visible: true
    });

    this.view = new InfoboxView({
      infoboxModel: this.model,
      infoboxCollection: new InfoboxCollection(states)
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.infoboxView).toBeDefined();
    expect(this.view.$('.Infobox').length).toBe(1);
    expect(this.view.$('h2').text()).toBe('Info');

    this.model.set({state: 'error'});

    expect(this.view.$('h2').text()).toBe('Error');
    expect(this.view.$('button').length).toBe(1);
  });

  it('should bind actions properly', function () {
    var model = this.view.infoboxCollection.at(1);
    spyOn(model.attributes, 'mainAction');

    this.model.set({state: 'error'});
    this.view.$('button').trigger('click');

    expect(model.attributes.mainAction).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
