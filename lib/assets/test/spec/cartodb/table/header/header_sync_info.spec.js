describe("Header sync info", function() {

  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table"
    });

    cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

    this.vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      cartodb_layer
    ]);

    this.user = TestUtil.createUser();

    this.$header = $('<header><div class="sync_status"></div></header>');

    // New visualization header
    this.header = new cdb.admin.Header({
      el: this.$header,
      globalError: { showError: {} },
      model: this.vis,
      user: this.user,
      config: TestUtil.config,
      geocoder: {}
    });

    this.header.setActiveLayer(
      new cdb.admin.LayerPanelView({
        model: cartodb_layer,
        vis: this.vis,
        map: this.vis.map,
        user: this.user,
        globalError: {}
      })
    );
  })

  afterEach(function() {
    this.header.clean();
    this.$header.remove();
  });

  it("shouldn't appear sync-info if table is not synced", function() {
    expect(this.header.$('.sync_status').html()).toBe('');
  });

  it("should appear sync-info after table is synced", function() {
    this.header.dataLayer.table.synchronization.set('id', 'test');
    expect(this.header.$('.sync_status').html()).not.toBe('');
  });

  it("should show sync now button", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success'
    });

    expect(this.header.$('a.sync_now').length).toBeTruthy();
  });

  it("shouldn't show sync now button", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'success'
    });

    expect(this.header.$('a.sync_now').length).toBeFalsy();
    expect(this.header.$('p.sync_now_disabled').length).toBeTruthy();
  });

  it("should open sync settings", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'success'
    });

    this.header.$('a.sync_options').click();
    expect(this.header.sync_info.sync_settings).toBeDefined();
    this.header.sync_info.sync_settings.clean();
  });

  it("should show syncing mamufas", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success'
    });

    this.header.$('a.sync_now').click();
    expect(this.header.sync_info.sync_now).toBeDefined();
    this.header.sync_info.sync_now.clean();
  });

  it("shouldn't hide syncing mamufas", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success'
    });

    this.header.$('a.sync_now').click();

    var e = jQuery.Event("keyup");
    e.keyCode = 27;
    $(document).trigger(e);

    expect(this.header.sync_info.sync_now).toBeDefined();
    expect(this.header.sync_info.sync_now.$el.html()).not.toBe('');
    this.header.sync_info.sync_now.clean();
  });

  it("shouldn't show syncing mamufas", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'success'
    });

    this.header.$('a.sync_now').click();
    expect(this.header.sync_info.sync_now).not.toBeDefined();
  });

  it("shouldn't display options when syncing is running", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'syncing'
    });

    expect(this.header.sync_info.$('a.sync_now').length).toBeFalsy();
    expect(this.header.sync_info.$('a.sync_options').length).toBeFalsy();
  });



});
