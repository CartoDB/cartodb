const GroupView = require('dashboard/views/organization/groups-admin/group-view/group-view');
const GroupModel = require('dashboard/data/group-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('organization/groups_admin/group_view', function () {
  beforeEach(function () {
    this.group = new GroupModel({
      display_name: 'foobar',
      shared_tables_count: 42,
      shared_maps_count: 37,
      users: [{
        id: 'u1',
        name: 'pepe'
      }]
    }, { configModel });

    this.view = new GroupView({
      model: this.group,
      url: 'group-url'
    });
    this.view.render();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the title', function () {
    expect(this.innerHTML()).toContain('foobar');
  });

  it('should render the URL', function () {
    expect(this.innerHTML()).toContain('href="group-url"');
  });

  it('should render the shared maps/datasets counts', function () {
    expect(this.innerHTML()).toContain('42 shared datasets');
    expect(this.innerHTML()).toContain('37 shared maps');
  });

  it('should render a preview of the users', function () {
    expect(this.innerHTML()).toContain('pepe');
  });

  afterEach(function () {
    this.view.clean();
  });
});
