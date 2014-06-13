
describe('cdb.admin.Organization', function() {

  var organization;
  beforeEach(function() {
    organization = new cdb.admin.Organization({
      "id":"68a57d79-d454-4b28-8af8-968e97b1349c",
      "seats":5,
      "quota_in_bytes":1234567890,
      "created_at":"2014-06-05T16:34:51+02:00",
      "updated_at":"2014-06-05T16:34:51+02:00",
      "name":"orgtest3",
      "owner":{"id":"4ab67a64-7cbf-4890-88b8-9d3c398249d5", "username":"dev", "avatar_url":null},
      "users":[
        {"id":"b6551618-9544-4f22-b8ba-2242d6b20733", "username":"t2", "avatar_url":null},
        {"id":"5b514d61-fb7a-4b9b-8a0a-3fdb82cf79ca", "username":"t1", "avatar_url":null}
      ]
    });


  });

  it ("should have owner", function() {
    expect(organization.owner.get('username')).toEqual('dev');
  });

  it ("should have users", function() {
    expect(organization.users.length).toEqual(2);
  });

});
