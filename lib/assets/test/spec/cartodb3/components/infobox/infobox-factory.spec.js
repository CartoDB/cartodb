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
      confirmType: 'secondary',
      confirmPosition: 'right'
    });

    view.render();

    expect(view.$('button.CDB-Button--secondary').length).toBe(1);
    expect(view.$('button').text()).toContain('Confirm');
  });

  it('createConfirmAndCancel', function () {
    view = Infobox.createConfirmAndCancel({
      title: 'Info',
      body: 'Lorem ipsum dolor sit amet.',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm',
      confirmPosition: 'right',
      cancelPosition: 'left'
    });
    view.render();

    expect(view.$('.Infobox')).toBeDefined();
    expect(view.$('button.CDB-Button--secondary').length).toBe(0);
    expect(view.$('button').length).toBe(2);
    expect(view.$('button').eq(0).text()).toContain('Cancel');
    expect(view.$('button').eq(1).text()).toContain('Confirm');
  });
});
