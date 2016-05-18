describe("Table/Visualization Header tests", function() {

  var cartodb_layer;
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
    cartodb_layer.table.permission.owner = this.user;

    this.$header = $(' \
      <header class="vis">\
        <div class="inner">\
          <div class="header_content">\
            <div class="vis_navigation">\
              <nav>\
                <a href="#/map" class="smaller strong tab selected">Map</a>\
                <a href="#/table" class="smaller strong tab">Data</a>\
              </nav>\
              <div class="globalerror"></div>\
            </div>\
            <div class="left">\
              <ul class="actions">\
                <li><a class="back" href="">Back</a></li>\
                <li><a class="privacy" href="#/visualize"><i class="privacy-status"></i></a></li>\
                <li><h1><a href="#/change-title" class="title"></a></h1></li>\
              </ul>\
              <div class="metadata">\
                <p><a href="#/edit-metadata">edit metadata…</a></p>\
              </div>\
            </div>\
            <div class="right">\
              <ul class="options">\
                <li><a class="dropdown options" href="#/options">options</a></li>\
                <li><a class="rounded share" href="#/visualize"><span>VISUALIZE</span></a></li>\
              </ul>\
            </div>\
          </div>\
          <div class="sync_status"></div>\
        </div>\
      </header>');

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

  it("should contain a change title link", function() {
    expect(this.header.$el.find('.title').length).toBeTruthy();
  })

  it("should create the title change dialog on click", function(done) {
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.title_dialog).toBeTruthy();
      self.header.title_dialog.hide();
      done();
    }, 25);

  })

  it("should open a warning dialog when user changes the title", function(done) {
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {

      self.header.title_dialog.$('input').val('example');
      self.header.title_dialog.$('.ok').click();

      setTimeout(function() {
        expect(self.header.change_confirmation).toBeTruthy();
        self.header.title_dialog.clean();
        self.header.change_confirmation.clean();
        done();
      }, 25);

    }, 25);

  })

  it("should not open the warning dialog when user changes the title", function(done) {
    this.vis.set('type', 'derived');
    $(this.header.el).find('.title').click();
    this.header._onSetAttributes = function() {};

    var self = this;

    setTimeout(function() {
      self.header.title_dialog.$('input').val('example');
      self.header.title_dialog.$('.ok').click();

      setTimeout(function() {
        expect(self.header.change_confirmation).toBeFalsy();
        self.header.title_dialog.clean();
        done();
      }, 25);

    }, 25);

  })

  it("should not let the user change the visualization/table name when the table is not writable", function(done) {
    this.vis.map.layers.last().table.sqlView = {
      isReadOnly: function() { return true; }
    }
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      var $title = self.header.$('a.title');
      expect($title.data('tipsy')).toBeDefined();
      expect($title.data('tipsy').$tip.is(':visible')).toBeTruthy();
      expect(self.header.title_dialog).toBeFalsy();
      done();
    }, 25);

  });

  it("should not let the user change the visualization/table name when the table is syncable", function(done) {
    this.vis.map.layers.last().table.synchronization.set({id: 'test', from_external_source: false });
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.title_dialog).toBeFalsy();
      done();
    }, 25);

  })


  it("should let the user change the visualization name although the table is syncable", function(done) {
    this.vis.set('type', 'derived');
    this.vis.map.layers.last().table.synchronization.set({id: 'test', from_external_source: false });
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.title_dialog).toBeTruthy();
      self.header.title_dialog.clean();
      done();
    }, 25);
  })

  it("should render sync info when table is synced", function() {
    this.vis.map.layers.last().table.synchronization.set({id: 'test', from_external_source: false });
    expect(this.header.sync_info.el).toBeDefined();
    expect($(this.header.el).find('.sync_status').length).toBe(1);
  })

  it("should remove sync info when table is not synced", function() {
    this.vis.map.layers.last().table.synchronization.set({id: 'test', from_external_source: false });
    expect(this.header.sync_info).toBeDefined();
    expect($(this.header.el).find('.sync_status .sync_info').length).toBe(1);
    this.vis.map.layers.last().table.synchronization.destroy();
    expect($(this.header.el).find('.sync_status .sync_info').length).toBe(0);
  });

  it("should add the privacy class on the status selector link", function() {
    this.vis.set('privacy', 'public');
    expect($(this.header.el).find('.privacy').hasClass('public')).toBeTruthy();
  })

  it("should remove the previous privacy class when the status change", function() {
    this.vis.set('privacy', 'private');
    expect($(this.header.el).find('.privacy').hasClass('public')).toBeFalsy();
  })

  it("should add the number of shared users if the table/vis is shared and you are the owner", function() {
    this.vis.permission.owner = this.user;
    this.vis.permission.acl.reset([{ entity: {}, type: 'user', access: 'r' }]);
    expect(this.header.$('.privacy i span.shared_users').text()).toBe('1');
    this.vis.permission.acl.reset([{ entity: {}, type: 'org', access: 'r' }]);
    expect(this.header.$('.privacy i span.shared_users').text()).toBe('ORG');
    this.vis.permission.acl.reset([{ entity: {}, type: 'user', access: 'r' }, { entity: {}, type: 'user', access: 'r' }]);
    expect(this.header.$('.privacy i span.shared_users').text()).toBe('2');
  });

  it("shouldn't show shared-users count and add disable class when user is not the owner of the table", function() {
    this.vis.permission.owner = this.user;
    this.header.setInfo();
    expect(this.header.$('.privacy i').hasClass('disabled')).toBeFalsy();
    this.vis.permission.owner = new cdb.admin.User({ id: 'rambo2' });
    this.vis.permission.acl.reset([{ entity: {}, type: 'user', access: 'r' }]);
    this.header.setInfo();
    expect(this.header.$('.privacy i').hasClass('disabled')).toBeTruthy();
    expect(this.header.$('.privacy i span.shared_users').length).toBe(0);
  })

  it("shouldn't open 'privacy dialog' when user is not owner of the table/vis", function() {
    this.header.model.set('table', { id:1 });
    spyOn(cdb.editor.ChangePrivacyView.prototype, 'initialize').and.callThrough();

    this.header.setInfo();
    this.header.$('.privacy i').click();
    expect(cdb.editor.ChangePrivacyView.prototype.initialize).not.toHaveBeenCalled();

    this.vis.permission.owner = this.user;
    this.header.setInfo();
    this.header.$('.privacy i').click();
    expect(cdb.editor.ChangePrivacyView.prototype.initialize).toHaveBeenCalled();
  })

  it("shouldnt allow to edit table when user is not the owner", function() {
    this.vis.set('derived', false);
    cartodb_layer.table.permission.owner = this.user;
    this.header.setInfo();
    this.header.title_dialog = null;
    this.header.$('a.title').click();
    expect(this.header.title_dialog).not.toEqual(null);
    this.header.title_dialog.clean();

    cartodb_layer.table.permission.owner =  new cdb.admin.User({ id: 'test_not_owner' });
    this.header.setInfo();
    this.header.title_dialog = null;
    this.header.$('a.title').click();
    expect(this.header.title_dialog).toEqual(null);

  })

  it("should show visualize button when visualization type is table", function() {
    expect($(this.header.el).find('.share span').text()).toBe('VISUALIZE');
  })

  it("should change share button when visualization type is derived", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.share span').text()).toBe('PUBLISH');
  });

  it("should change href of back button when user belongs to an organization", function() {
    this.vis.set('type', 'derived');
    expect(this.header.$('a.back').attr('href')).toBe('/dashboard/maps');

    this.vis.set('type', 'table');
    expect(this.header.$('a.back').attr('href')).toBe('/dashboard/datasets');

    var originalPrefixUrl = cdb.config.prefixUrl;
    cdb.config.prefixUrl = function() { return '/u/staging20' };

    this.header._setVisualization();
    expect(this.header.$('a.back').attr('href')).toBe('/u/staging20/dashboard/datasets');

    this.vis.set('type', 'derived');
    expect(this.header.$('a.back').attr('href')).toBe('/u/staging20/dashboard/maps');

    // Restore cdb.config to not affect other tests
    cdb.config.prefixUrl = originalPrefixUrl;
  });

  it("should create a new options dropdown menu each time link is clicked", function() {
    this.header.options.visualization = this.header.model;
    this.header.$('.dropdown').click();
    var optionsMenuCid = this.header.options_menu.cid;
    this.header.$('.dropdown').click();
    expect(optionsMenuCid).not.toEqual(this.header.options_menu);
  });

  it("should check sync info when data layer changes", function() {
    spyOn(this.header, '_setSyncInfo');
    this.vis.map.layers.last().table.sqlView = '';
    // Simulate select new dataLayer
    this.header.setActiveLayer({
      model: this.vis.map.layers.last()
    });
    expect(this.header._setSyncInfo).toHaveBeenCalled();
  });

  it("should redirect to a qualified table url if user is not the owner", function() {
    // Set table necessary info
    this.vis.set({ table: { name: "untitled_table_9" }})
    // Set permissions
    this.vis.permission = new cdb.admin.Permission({
      owner: { username: 'paco', avatar_url: 'http://test.com', id: 10 },
      acl: []
    });

    expect(this.header._generateTableUrl()).toBe('/tables/paco.untitled_table_9/table');
  });

  it("should redirect to a normal table url if user is the owner", function() {
    // Set table necessary info
    this.vis.set({ table: { name: "untitled_table_9" }})
    // Set permissions
    this.vis.permission = new cdb.admin.Permission({
      owner: { username: 'test', avatar_url: 'http://test.com', id: 2 },
      acl: []
    });

    expect(this.header._generateTableUrl()).toBe('/tables/untitled_table_9/table');
  });

});
