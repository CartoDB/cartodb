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

  describe('.click #header-settings-dropdown', function() {
    beforeEach(function() {
      this.settingsDropdownMock = jasmine.createSpyObj('fake-SettingsDropdown-object', ['render', 'on', 'open', 'clean']);
      this.settingsDropdownMock.options = {
        target: jasmine.createSpyObj('dropdown-target-element', ['unbind'])
      };
      this.SettingsDropdownSpy = jasmine.createSpy('fake-SettingsDropdown-constructor');
      this.SettingsDropdownSpy.and.returnValue(this.settingsDropdownMock);
      HeaderView.__set__('SettingsDropdown', this.SettingsDropdownSpy);

      var $el = $('<div><a id="header-settings-dropdown" href="#">User settings dropdown</a></div>');
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
        this.view.$('#header-settings-dropdown').click();
      }
    });

    it('should create a settings dropdown with expected params', function() {
      this.clickSettings();

      expect(this.SettingsDropdownSpy).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.SettingsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith.model).toBe(this.user);
      expect(viewToBeInstantiatedWith.navigation).toBe(this.navigation);
      expect(viewToBeInstantiatedWith.target[0]).toEqual(this.view.$('#header-settings-dropdown')[0]);
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

      // trigger the listener callback manually to verify assertions below
      this.settingsDropdownMock.on.calls.argsFor(0)[1].call(this.view);

      expect(this.settingsDropdownMock.clean).toHaveBeenCalled();
      expect(this.settingsDropdownMock.options.target.unbind).toHaveBeenCalledWith('click');
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickSettings();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });

    afterEach(function() {
      this.view.clean();
    })
  });

  describe('.click #maps-settings-dropdown', function() {
    beforeEach(function() {
      this.mapsDropdownMock = jasmine.createSpyObj('fake-MapsDropdown-object', ['render', 'on', 'open', 'clean']);
      this.mapsDropdownMock.options = {
        target: jasmine.createSpyObj('dropdown-target-element', ['unbind'])
      };
      this.MapsDropdownSpy = jasmine.createSpy('fake-MapsDropdown-constructor');
      this.MapsDropdownSpy.and.returnValue(this.mapsDropdownMock);
      HeaderView.__set__('MapsDropdown', this.MapsDropdownSpy);

      var $el = $('<div><a id="header-maps-dropdown" href="#">User maps dropdown</a></div>');
      $(document.body).append($el);

      this.user = new Backbone.Model();
      this.navigation = new Backbone.Model();
      this.view = new HeaderView({
        el: $el,
        model: this.user,
        navigation: this.navigation
      });
      this.view.render();

      this.clickMaps = function() {
        this.view.$('#header-maps-dropdown').click();
      }
    });

    it('should create a maps dropdown with expected params', function() {
      this.clickMaps();

      expect(this.MapsDropdownSpy).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.MapsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith.model).toBe(this.user);
      expect(viewToBeInstantiatedWith.target[0]).toEqual(this.view.$('#header-maps-dropdown')[0]);
      expect(viewToBeInstantiatedWith.template_base).toEqual('new_dashboard/header/maps_dropdown');
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickMaps();
      expect(this.mapsDropdownMock.render).toHaveBeenCalled();
      expect(this.mapsDropdownMock.open).toHaveBeenCalled();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      var spy = spyOn(this.view, 'killEvent');
      this.clickMaps();
      expect(spy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(this.view, 'addView');
      this.clickMaps();
      expect(spy).toHaveBeenCalled();
    });

    it('should clean up dropdown view after the dropdown is hidden', function() {
      this.clickMaps();

      expect(this.mapsDropdownMock.on).toHaveBeenCalledWith('onDropdownHidden', jasmine.any(Function), this.view);

      // trigger the listener callback manually to verify assertions below
      this.mapsDropdownMock.on.calls.argsFor(0)[1].call(this.view);

      expect(this.mapsDropdownMock.clean).toHaveBeenCalled();
      expect(this.mapsDropdownMock.options.target.unbind).toHaveBeenCalledWith('click');
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickMaps();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });

    afterEach(function() {
      this.view.clean();
    })
  });
});
