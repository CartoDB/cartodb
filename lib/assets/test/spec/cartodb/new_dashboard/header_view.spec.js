var HeaderView = require('new_dashboard/header_view');
var Backbone = require('backbone');
var $ = require('jquery');

  describe('new_dashboard/header_view', function() {
  describe('.render', function() {
    beforeEach(function() {
      this.view = new HeaderView({
        el: $('<div />')
      });
    });

    it('should have no leaks', function() {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should clear sub views', function() {
      var spy = spyOn(this.view, 'clearSubViews');
      this.view.render();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('.click #settings', function() {
    beforeEach(function() {
      this.settingsDropdownMock = jasmine.createSpyObj('fake-SettingsDropdown-object', ['render', 'on', 'open', 'clean']);
      this.SettingsDropdownSpy = jasmine.createSpy('fake-SettingsDropdown-constructor');
      this.SettingsDropdownSpy.and.returnValue(this.settingsDropdownMock);
      HeaderView.__set__('SettingsDropdown', this.SettingsDropdownSpy);

      var $el = $('<div><a id="settings" href="#">User settings dropdown</a></div>');
      $(document.body).append($el);

      this.user = new Backbone.Model();
      this.navigation = new Backbone.Model();
      this.view = new HeaderView({
        el: $el,
        model: this.user,
        navigation: this.navigation
      });
      this.view.render();

      this.clickSettings = function() {
        this.view.$('#settings').click();
      }
    });

    it('should create a settings dropdown with expected params', function() {
      this.clickSettings();

      expect(this.SettingsDropdownSpy).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.SettingsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith.model).toBe(this.user);
      expect(viewToBeInstantiatedWith.navigation).toBe(this.navigation);
      expect(viewToBeInstantiatedWith.target[0]).toEqual(this.view.$('#settings')[0]);
      expect(viewToBeInstantiatedWith.template_base).toEqual('new_dashboard/header/settings_dropdown');
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickSettings();
      expect(this.settingsDropdownMock.render).toHaveBeenCalled();
      expect(this.settingsDropdownMock.open).toHaveBeenCalled();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      var spy = spyOn(this.view, 'killEvent');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(this.view, 'addView');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should clean up dropdown view after the dropdown is hidden', function() {
      this.clickSettings();
      expect(this.settingsDropdownMock.on).toHaveBeenCalledWith('onDropdownHidden', jasmine.any(Function), this.view);
      this.settingsDropdownMock.on.calls.argsFor(0)[1].call(this.view); //trigger the callback manually
      expect(this.settingsDropdownMock.clean).toHaveBeenCalled();
    });

    afterEach(function() {
      this.view.clean();
    })
  });
});
