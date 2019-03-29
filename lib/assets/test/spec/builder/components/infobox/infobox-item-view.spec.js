var InfoboxView = require('builder/components/infobox/infobox-item-view');

describe('components/infobox/infobox-item-view', function () {
  var view;

  beforeEach(function () {
    view = new InfoboxView({
      type: 'error',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      action: {
        label: 'Proceed'
      },
      closable: true
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('h2').text()).toBe('Info');
    expect(view.$('div').text()).toContain('Lorem ipsum');
    expect(view.$('.Infobox-buttons button').length).toBe(2);
    expect(view.$('.Infobox-buttons button').eq(0).html()).toContain('editor.messages.common.cancel');
    expect(view.$('.Infobox-buttons button').eq(1).html()).toContain('Proceed');
  });

  it('should have className when it is defined', function () {
    var className = 'fs-class-name';

    var view = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      klass: className
    });

    view.render();

    expect(view.$el.hasClass(className)).toBe(true);
  });

  it('should render loading when it is defined', function () {
    var view = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      loading: true
    });

    view.render();
    expect(view.$('.CDB-LoaderIcon').length).toBe(1);
  });

  it('should render quota when needed', function () {
    var view = new InfoboxView({
      type: 'alert',
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      quota: {
        usedQuota: 10,
        totalQuota: 100
      },
      action: {
        label: 'Proceed'
      }
    });

    view.render();
    expect(view.$('.js-quota').length).toBe(1);
    expect(view.$('.Infobox-quotaBar').length).toBe(1);
  });

  it('should trigger events properly', function () {
    var callback = {
      main: function () {},
      close: function () {}
    };

    spyOn(callback, 'main');
    spyOn(callback, 'close');

    view.on('action:main', callback.main);
    view.on('action:close', callback.close);

    view.$('button').eq(0).trigger('click');
    view.$('button').eq(1).trigger('click');

    expect(callback.main.calls.count()).toEqual(1);
    expect(callback.close.calls.count()).toEqual(1);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
