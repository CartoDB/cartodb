var InfoboxView = require('../../../../../javascripts/cartodb3/components/infobox/infobox-item-view');

describe('components/infobox/infobox-item-view', function () {
  var view;

  beforeEach(function () {
    view = new InfoboxView({
      type: 'error',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      mainAction: {
        label: 'Cancel'
      },
      secondAction: {
        label: 'Proceed'
      }
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('h2').text()).toBe('Info');
    expect(view.$('div').text()).toContain('Lorem ipsum');
    expect(view.$('a').length).toBe(2);
    expect(view.$('a').eq(0).text()).toContain('Cancel');
    expect(view.$('a').eq(1).text()).toContain('Proceed');
  });

  it('should trigger events properly', function () {
    var callback = {
      main: function () {},
      second: function () {}
    };

    spyOn(callback, 'main');
    spyOn(callback, 'second');

    view.on('action:main', callback.main);
    view.on('action:second', callback.second);

    view.$('a').eq(0).trigger('click');
    view.$('a').eq(1).trigger('click');

    expect(callback.main.calls.count()).toEqual(1);
    expect(callback.second.calls.count()).toEqual(1);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
