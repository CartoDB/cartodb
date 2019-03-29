const UserGroupsCollection = require('dashboard/data/user-groups-collection.js');

const org = require('fixtures/dashboard/organization-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/user-groups-collection', function () {
  beforeEach(function () {
    this.org = org;
    this.userGroupsCollection = new UserGroupsCollection(undefined, {
      organization: this.org,
      configModel
    });
  });

  it('should have an organization', function () {
    expect(this.userGroupsCollection.organization).toBe(this.org);
  });

  it('should add groups correctly even without a configModel', function () {
    const newCollection = new UserGroupsCollection({
      id: 'g1'
    }, {
      organization: this.org,
      configModel
    });

    newCollection.add({
      id: 'g2'
    });

    expect(newCollection.first()._configModel).not.toBeUndefined();
    expect(newCollection.first().get('id')).toBe('g1');
    expect(newCollection.last().get('id')).toBe('g2');
    expect(newCollection.last()._configModel).not.toBeUndefined();
  });
});
