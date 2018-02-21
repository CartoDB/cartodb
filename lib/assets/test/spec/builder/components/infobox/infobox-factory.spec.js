var Infobox = require('builder/components/infobox/infobox-factory');

describe('components/infobox/infobox-factory', function () {
  var view;

  describe('createInfo', function () {
    it('no closable', function () {
      view = Infobox.createInfo({
        title: 'Info',
        body: 'Lorem ipsum dolor sit amet.',
        closable: false
      });
      view.render();

      expect(view.$('button').length).toBe(0);
    });

    it('closable', function () {
      view = Infobox.createInfo({
        title: 'Info',
        body: 'Lorem ipsum dolor sit amet.'
      });
      view.render();

      expect(view.$('button .CDB-Shape-close').length).toBe(1);
    });
  });

  describe('createWithActions', function () {
    it('main action', function () {
      view = Infobox.createWithAction({
        title: 'Info',
        body: 'Lorem ipsum dolor sit amet.',
        closable: false,
        mainAction: {
          label: 'Confirm'
        }
      });

      view.render();

      expect(view.$('.Infobox')).toBeDefined();
      expect(view.$('button').length).toBe(1);
      expect(view.$('button').text()).toContain('Confirm');
    });

    it('second action', function () {
      view = Infobox.createWithAction({
        title: 'Info',
        body: 'Lorem ipsum dolor sit amet.',
        mainAction: {
          label: 'Confirm'
        },
        secondAction: {
          label: 'Cancel'
        }
      });

      view.render();

      expect(view.$('.Infobox')).toBeDefined();
      expect(view.$('.js-close').length).toBe(1);
      expect(view.$('.Infobox-buttons button').length).toBe(2);
      expect(view.$('.Infobox-buttons button').eq(0).text()).toContain('Confirm');
      expect(view.$('.Infobox-buttons button').eq(1).text()).toContain('Cancel');
    });
  });
});
