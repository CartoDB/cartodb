var UserSettingsView = require('dashboard/components/navbar/user-settings-view');
var UserModel = require('dashboard/data/user-model');
var ConfigModel = require('dashboard/data/config-model');

var cleanDropdowns = function () {
  var dropdowns = document.querySelectorAll('.Dropdown');
  [].forEach.call(dropdowns, function (node) {
    var parent = node.parentNode;
    parent && parent.removeChild(node);
  });
};

describe('dashboard/components/navbar/user-settings-view', function () {
  beforeEach(function () {
    this.config = new ConfigModel();

    this.user = new UserModel({
      base_url: 'http://pepe.carto.com',
      username: 'Pepe',
      email: 'pepe@paco.com',
      avatar_url: '//path/to/img.png'
    }, {
      configModel: this.config
    });

    this.view = new UserSettingsView({
      model: this.user
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered avatar url', function () {
    expect(this.innerHTML()).toContain('<img src="' + this.user.get('avatar_url') + '"');
  });

  describe('when click .js-dropdown-target', function () {
    beforeEach(function () {
      this.view.$('.js-dropdown-target').click();
    });

    it('should open a dropdown', function () {
      expect(document.body.innerHTML).toContain('Close session');
    });
  });

  afterEach(function () {
    cleanDropdowns();
    this.view.clean();
  });
});
