const parseDomains = require('./parse-domains');

module.exports = {
  redirectOrgUsers: function (organization, username, page, location) {
    const domains = parseDomains(location.href);
    if (organization && organization.name && domains.subdomain &&
      domains.subdomain === username) {
      const newOrigin = location.origin.replace(domains.subdomain, organization.name);
      const newPathname = `/u/${username}/${page}`;
      location.replace(`${newOrigin}${newPathname}`);
    }
  }
};
