var Infobox = require('../../../../../javascripts/cartodb3/components/infobox/infobox-factory');

describe('components/infobox/infobox-factory', function () {
  var view;

  it('createInfo', function () {
    view = Infobox.createInfo({
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.'
    });
    view.render();

    expect(view.$('a').length).toBe(0);
    expect(view.$('button').length).toBe(0);
  });

  it('createConfirm', function () {
    view = Infobox.createConfirm({
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      confirmLabel: 'Confirm',
      confirmType: 'button'
    });

    view.render();

    expect(view.$('a').length).toBe(0);
    expect(view.$('button').length).toBe(1);
    expect(view.$('button').text()).toContain('Confirm');
  });

  it('createConfirmAndCancel', function () {
    view = Infobox.createConfirmAndCancel({
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm'
    });
    view.render();

    expect(view.$('.Infobox')).toBeDefined();
    expect(view.$('a').length).toBe(2);
    expect(view.$('button').length).toBe(0);
    expect(view.$('a').eq(0).text()).toContain('Cancel');
    expect(view.$('a').eq(1).text()).toContain('Confirm');
  });
});
