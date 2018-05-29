const redirector = require('dashboard/helpers/redirector');

describe('dashboard/helpers/redirector', function () {
  it('should redirect if it is an org user with subdomain', function () {
    const fakeLocation = {
      origin: 'https://gza.carto.com',
      href: 'https://gza.carto.com/dashboard',
      replace: function () {}
    };
    spyOn(fakeLocation, 'replace');
    const organization = {
      name: 'wutangclan'
    };
    const username = 'gza';

    redirector.redirectOrgUsers(organization, username, 'dashboard', fakeLocation);

    expect(fakeLocation.replace).toHaveBeenCalledWith('https://wutangclan.carto.com/u/gza/dashboard');
  });

  it('should not redirect if it not an org user with subdomain', function () {
    const fakeLocation = {
      origin: 'https://gza.carto.com',
      href: 'https://gza.carto.com/dashboard',
      replace: function () {}
    };
    spyOn(fakeLocation, 'replace');
    const username = 'gza';

    redirector.redirectOrgUsers(null, username, 'dashboard', fakeLocation);

    expect(fakeLocation.replace).not.toHaveBeenCalled();
  });
});
