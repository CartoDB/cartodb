var SyncView = require('../../../../../../javascripts/cartodb/common/dialogs/map/sync_view');

describe('common/dialogs/map/sync_view', function() {
  beforeEach(function() {

    this.table = TestUtil.createTable('test');

    this.vis = new cdb.admin.Visualization({
      name: 'my_dataset',
      type: 'table',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      table: this.table,
      permission: {
        owner: {
          base_url: 'http://team.cartodb.com/u/paco',
          username: 'paco'
        }
      }
    });

    var synchronization = new cdb.core.Model({
      id: 1234,
      interval: 3600,
      name: "citibike_1",
      quoted_fields_guessing: true,
      ran_at: "2015-05-19T09:49:32+00:00",
      retried_times: 0,
      run_at: "2015-05-19T11:13:09+00:00",
      service_item_id: "/Public/citibike.csv",
      service_name: "dropbox",
      state: "success",
      from_external_source: false,
      type_guessing: true,
      updated_at: "2015-05-19T10:13:09+00:00",
      user_id: "a9263a25-2ed0-4688-898a-04f4cffbd736"
    });

    synchronization.urlRoot = "/";

    this.table.set("synchronization", synchronization);

    this.view = new SyncView({
      table: this.vis.get("table")
    });

    this.view.render();
  });

  it('should render the view as expected', function() {
    expect(this.innerHTML()).toContain('Sync Table options');
    expect(this.innerHTML()).toContain('Your table is in sync with a Dropbox file: /Public/citibike.csv');
    expect(this.innerHTML()).toContain('Every hour');
    expect(this.innerHTML()).toContain('Every day');
    expect(this.innerHTML()).toContain('Every week');
    expect(this.innerHTML()).toContain('Never');
    expect(this.view.$(".is-checked").parent().find(".RadioButton-label").text()).toContain('Every hour');
  });

  it('should select the checked interval', function() {
    this.view.$(".RadioButton:nth(2) button").click();
    expect(this.view.$(".is-checked").parent().find(".RadioButton-label").text()).toContain('Every week');
  });

  it('should save the checked interval', function() {
    this.view.$(".RadioButton:nth(1) button").click();
    this.view.$("button.ok").click();
    expect(this.vis.get("table").synchronization.get("interval")).toBe(60*60*24);
  });

  afterEach(function() {
    this.view.clean();
  });
});
