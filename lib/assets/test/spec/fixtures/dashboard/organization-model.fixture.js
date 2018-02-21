const OrganizationModel = require('dashboard/data/organization-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

module.exports = new OrganizationModel({
  id: 'o1'
}, { configModel });
