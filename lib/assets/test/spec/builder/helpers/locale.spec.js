var localeHelper = require('builder/helpers/locale');

describe('helpers/locale', function () {
  var data = {
    body: "You are over platform's limits. Please %{link} to know more details",
    link: 'contact us',
    href: 'mailto:support@carto.com'
  };

  it('should resolve properly', function () {
    expect(localeHelper.resolve('notifications.sql.429')).toEqual(data);
    expect(localeHelper.resolve('notifications.sql.429.link')).toEqual(data.link);
  });

  it('should linkify properly', function () {
    expect(localeHelper.linkify('notifications.sql.429')).toContain("<a href='mailto:support@carto.com'>contact us</a>");
  });
});
