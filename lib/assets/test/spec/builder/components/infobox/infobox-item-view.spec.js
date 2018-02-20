var InfoboxView = require('builder/components/infobox/infobox-item-view');

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
    expect(view.$('.Infobox-buttons button').length).toBe(2);
    expect(view.$('.Infobox-buttons button').eq(0).text()).toContain('Proceed');
    expect(view.$('.Infobox-buttons button').eq(1).text()).toContain('Cancel');
  });

  it('should have className when it is defined', function () {
    var className = 'fs-class-name';

    var v = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      klass: className
    });

    v.render();

    expect(v.$el.hasClass(className)).toBe(true);
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
