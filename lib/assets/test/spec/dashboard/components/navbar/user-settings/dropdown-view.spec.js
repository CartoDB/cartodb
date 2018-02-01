var SettingsDropdownView = require('dashboard/components/navbar/user-settings/dropdown-view');
var UserModel = require('dashboard/data/user-model');
var ConfigModel = require('dashboard/data/config-model');

describe('dashboard/components/navbar/user-settings/dropdown-view', function () {
  beforeEach(function () {
    this.config = new ConfigModel();

    this.user = new UserModel({
      base_url: 'http://pepe.carto.com',
      username: 'Pepe',
      email: 'pepe@paco.com'
    }, {
      configModel: this.config
    });

    this.view = new SettingsDropdownView({
      model: this.user
    });

    spyOn(this.view, 'hide');

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should have rendered a top block with user meta', function () {
    expect(this.innerHTML()).toContain(this.user.get('username'));
    expect(this.innerHTML()).toContain(this.user.get('email'));
  });

  afterEach(function () {
    this.view.clean();
  });
});
