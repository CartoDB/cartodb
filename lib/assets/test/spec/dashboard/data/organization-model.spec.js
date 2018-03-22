const OrganizationModel = require('dashboard/data/organization-model');
const CONFIG_MODEL = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/organization-model', function () {
  beforeEach(function () {
    this.organization = new OrganizationModel({
      id: '68a57d79-d454-4b28-8af8-968e97b1349c',
      seats: 5,
      quota_in_bytes: 1234567890,
      created_at: '2014-06-05T16:34:51+02:00',
      updated_at: '2014-06-05T16:34:51+02:00',
      name: 'orgtest3',
      owner: { id: '4ab67a64-7cbf-4890-88b8-9d3c398249d5', username: 'dev', avatar_url: null },
      users: []
    }, { configModel: CONFIG_MODEL });
  });

  it('should have a users collection attribute', function () {
    expect(this.organization.users).not.toBeUndefined();
  });

  it('all collections should have reference to the organization', function () {
    var newOrg = new OrganizationModel({
      id: '68a57d79-d454-4b28-8af8-968e97b1349c',
      seats: 5,
      quota_in_bytes: 1234567890,
      created_at: '2014-06-05T16:34:51+02:00',
      updated_at: '2014-06-05T16:34:51+02:00',
      name: 'orgtest3',
      owner: { id: '4ab67a64-7cbf-4890-88b8-9d3c398249d5', username: 'dev', avatar_url: null },
      users: [
        {id: 'b6551618-9544-4f22-b8ba-2242d6b20733', 'username': 't2', 'avatar_url': null},
        {id: '5b514d61-fb7a-4b9b-8a0a-3fdb82cf79ca', 'username': 't1', 'avatar_url': null}
      ],
      groups: [
        {id: 'g1'},
        {id: 'g2'}
      ]
    }, { configModel: CONFIG_MODEL });
    expect(newOrg.users.organization).toEqual(newOrg);
    expect(newOrg.groups.organization).toEqual(newOrg);
    expect(newOrg.grantables.organization).toEqual(newOrg);
  });
});
