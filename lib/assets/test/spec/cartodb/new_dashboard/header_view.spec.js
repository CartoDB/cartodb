var HeaderView = require('new_dashboard/header_view');
var Backbone = require('backbone');
var $ = require('jquery');

describe('new_dasboard/header_view', function() {
  describe('.render', function() {
    beforeEach(function() {
      this.settingsDropdownSpy = jasmine.createSpyObj('fake settingsDropdown instance', ['render', 'clean']);
      this.SettingsDropdownSpy = jasmine.createSpy('fake SettingsDrop constructor');
      this.SettingsDropdownSpy.and.returnValue(this.settingsDropdownSpy);
      HeaderView.__set__('SettingsDropdown', this.SettingsDropdownSpy);

      var $el = $('<div><a id="settings" href="#">User settings dropdown</a></div>');
      $(document.body).append($el);

      this.user = new Backbone.Model();
      this.view = new HeaderView({
        el: $el,
        model: this.user
      });
      this.view.render();
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should rendered a settings dropdown with expected params', function() {
      expect(this.SettingsDropdownSpy).toHaveBeenCalled();
      expect(this.settingsDropdownSpy.render).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.SettingsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith.model).toEqual(this.user);
      expect(viewToBeInstantiatedWith.target).toEqual(this.view.$('#settings'));
      expect(viewToBeInstantiatedWith.template_base).toEqual('new_dashboard/header/settings_dropdown');
    });

    afterEach(function() {
      this.view.clean();
    })
  });
});
