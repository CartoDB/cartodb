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

      expect(view.$('button').length).toBe(1);
      expect(view.$('button').eq(0).html()).toContain('editor.messages.common.cancel');
    });
  });

  describe('createWithActions', function () {
    it('main action', function () {
      view = Infobox.createWithAction({
        title: 'Info',
        body: 'Lorem ipsum dolor sit amet.',
        closable: false,
        action: {
          label: 'Confirm'
        }
      });

      view.render();

      expect(view.$('.Infobox')).toBeDefined();
      expect(view.$('button').length).toBe(1);
      expect(view.$('button').text()).toContain('Confirm');
    });
  });
});
