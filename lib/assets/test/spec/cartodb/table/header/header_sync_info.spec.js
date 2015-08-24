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
    this.header.dataLayer.table.synchronization.set({ id: 'test', from_external_source: false });
    expect(this.header.$('.sync_status').html()).not.toBe('');
  });

  it("should show sync now button", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success',
      from_external_source: false
    });

    expect(this.header.$('a.sync_now').length).toBeTruthy();
  });

  it("shouldn't show sync now button when is from external source", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success',
      from_external_source: true
    });

    expect(this.header.$('a.sync_now').length).toBeFalsy();
  });

  it("shouldn't show sync now button", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'success',
      from_external_source: false
    });

    expect(this.header.$('a.sync_now').length).toBeFalsy();
    expect(this.header.$('em.sync_now_disabled').length).toBeTruthy();
  });

  it("should open sync settings", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'success',
      from_external_source: false
    });
    spyOn(cdb.editor.SyncView.prototype, 'initialize').and.callThrough();

    this.header.$('a.sync_options').click();
    expect(cdb.editor.SyncView.prototype.initialize).toHaveBeenCalled();
  });

  it("should show syncing mamufas", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success',
      from_external_source: false
    });

    this.header.$('a.sync_now').click();
    expect(this.header.sync_info.sync_now).toBeDefined();
    this.header.sync_info.sync_now.clean();
  });

  it("shouldn't hide syncing mamufas", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date('1980/2/2'),
      id:       'test',
      state:    'success',
      from_external_source: false
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
      state:    'success',
      from_external_source: false
    });

    this.header.$('a.sync_now').click();
    expect(this.header.sync_info.sync_now).not.toBeDefined();
  });

  it("shouldn't display options when syncing is running", function() {
    this.header.dataLayer.table.synchronization.set({
      ran_at:   new Date(),
      id:       'test',
      state:    'syncing',
      from_external_source: false
    });

    expect(this.header.sync_info.$('a.sync_now').length).toBeFalsy();
    expect(this.header.sync_info.$('a.sync_options').length).toBeFalsy();
  });



});
