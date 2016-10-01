var InfoboxView = require('../../../../../javascripts/cartodb3/components/infobox/infobox-item-view');

describe('components/infobox/infobox-item-view', function () {
  var view;

  beforeEach(function () {
    view = new InfoboxView({
      type: 'error',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      mainAction: {
        label: 'Proceed',
        position: 'right'
      },
      secondAction: {
        label: 'Cancel',
        position: 'left'
      }
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('h2').text()).toBe('Info');
    expect(view.$('div').text()).toContain('Lorem ipsum');
    expect(view.$('button').length).toBe(2);
    expect(view.$('button').eq(0).text()).toContain('Cancel');
    expect(view.$('button').eq(1).text()).toContain('Proceed');
  });

  it('should render loading when it is defined', function () {
    var v = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      loading: true
    });

    v.render();
    expect(v.$('.CDB-LoaderIcon').length).toBe(1);
  });

  it('should render quota when needed', function () {
    var v = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      quota: {
        usedQuota: 10,
        totalQuota: 100
      },
      secondAction: {
        label: 'Proceed'
      }
    });

    v.render();
    expect(v.$('.js-quota').length).toBe(1);
    expect(v.$('.Infobox-quotaBar').length).toBe(1);
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

    view.$('button').eq(0).trigger('click');
    view.$('button').eq(1).trigger('click');

    expect(callback.main.calls.count()).toEqual(1);
    expect(callback.second.calls.count()).toEqual(1);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
