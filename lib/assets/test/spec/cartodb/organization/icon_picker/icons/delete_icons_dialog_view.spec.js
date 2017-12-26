var View = require('../../../../../../javascripts/cartodb/organization/icon_picker/icons/delete_icons_dialog_view');

describe('organization/icon_picker/icons/delete_icons_dialog_view', function () {
  describe('render', function () {
    it('should render properly when several icons', function () {
      var view = new View({
        numOfIcons: 5,
        okCallback: function () {}
      });

      view.render();

      expect(view.$('.Badge').text()).toEqual('5');
      expect(view.$('h4').text()).toContain('5 icons');
      expect(view.$('.Dialog-header p').text()).toContain('these icons');
    });

    it('should render properly when only 1 icon', function () {
      var view = new View({
        numOfIcons: 1,
        okCallback: function () {}
      });

      view.render();

      expect(view.$('.Badge').text()).toEqual('1');
      expect(view.$('h4').text()).toContain('1 icon');
      expect(view.$('.Dialog-header p').text()).toContain('this icon');
      expect(view.$('.Dialog-header p').text()).not.toContain('these icons');
    });

    it('should render properly when no icon', function () {
      var view = new View({
        numOfIcons: 0,
        okCallback: function () {}
      });

      view.render();

      expect(view.$('.Badge').length).toBe(0);
      expect(view.$('h4').text()).toContain('icons');
      expect(view.$('.Dialog-header p').text()).toContain('these icons');
    });

    it('should have no leaks', function () {
      var view = new View({
        numOfIcons: 5,
        okCallback: function () {}
      });

      expect(view).toHaveNoLeaks();
    });
  });

  describe('ok', function () {
    it('should call `ok` callback and close', function () {
      var view = new View({
        numOfIcons: 5,
        okCallback: function () {}
      });
      spyOn(view, '_okCallback');
      spyOn(view, 'close');

      view.ok();

      expect(view._okCallback).toHaveBeenCalled();
      expect(view.close).toHaveBeenCalled();
    });
  });
});
