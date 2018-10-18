const GroupModel = require('dashboard/data/group-model');

const configModel = require('fixtures/dashboard/config-model.fixture');

module.exports = new GroupModel({ id: 'g1' }, { configModel });
