describe("Table/Visualization Header tests", function() {

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

    this.$header = $('<header><div class="left">\
      <ul class="actions">\
        <li><a href="#" class="back">Back</a></li>\
        <li><span class="type">T</span></li>\
        <li><h1><a href="#/change-title" class="title"></a></h1></li>\
        <li><a href="#/change-status" class="status button_header rounded white"></a></li>\
        <li><span class="tags"></span></li>\
      </ul>\
      <div class="description">\
        <p><a href="#/change-description"></a></p>\
      </div>\
      <nav>\
        <a href="#/table" class="smaller strong tab selected">Table</a>\
        <a href="#/map" class="smaller strong tab">Map view</a>\
      </nav>\
    </div>\
    <div class="right">\
      <ul class="options">\
        <li><a href="#/visualize" class="rounded privacy public share"><i></i><span>VISUALIZE</span></a></li>\
      </ul>\
    </div><div class="sync_status"></div></header>');

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
      $('.edit_name_dialog').remove();
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
    this.header._onSetAttribute = function() {};

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
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.title_dialog).toBeFalsy();
      done();
    }, 25);

  });

  it("should not let the user change the visualization/table name when the table is syncable", function(done) {
    this.vis.map.layers.last().table.synchronization.set('id', 'test');
    $(this.header.el).find('.title').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.title_dialog).toBeFalsy();
      done();
    }, 25);

  })

  it("should open description_dialog on click", function(done) {
    $(this.header.el).find('.description p a').click();

    var self = this;

    setTimeout(function() {
      expect(self.header.description_dialog).toBeTruthy();
      self.header.description_dialog.clean();
      done();
    }, 25);
  });

  it("should not open description_dialog on click when sql aplied", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.description a').click();
    expect(this.header.description_dialog).toBeFalsy();
  })

  it("should open tags dialog on click", function(done) {
    $(this.header.el).find('.tags a').click();

    var self = this;

    setTimeout(function(){
      expect(self.header.tags_dialog).toBeTruthy();
      self.header.tags_dialog.clean();
      done();
    }, 25);

  })

  it("should not open tags dialog on click when sql aplied", function(done) {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.tags a').click();

    var self = this;

    setTimeout(function(){
      expect(self.header.tags_dialog).toBeFalsy();
      done();
    }, 25);

  });

  it("should add default description when no description", function() {
    this.vis.set('description', null);
    expect($(this.header.el).find('.description p a').text()).toEqual(this.header._TEXTS.description.normal)
  });

  it("should add table description ", function() {
    this.vis.set({'description': 'cachopada'});
    expect($(this.header.el).find('.description p a').html()).toEqual('cachopada')
  })

  it("should render sync info when table is synced", function() {
    this.vis.map.layers.last().table.synchronization.set('id', 'test');
    expect(this.header.sync_info.el).toBeDefined();
    expect($(this.header.el).find('.sync_status').length).toBe(1);
  })

  it("should remove sync info when table is not synced", function() {
    this.vis.map.layers.last().table.synchronization.set('id', 'test');
    expect(this.header.sync_info).toBeDefined();
    expect($(this.header.el).find('.sync_status .sync_info').length).toBe(1);
    this.vis.map.layers.last().table.synchronization.destroy();
    expect($(this.header.el).find('.sync_status .sync_info').length).toBe(0);
  });

  it("should add table description even when there's an sql", function() {
    this.vis.set({'description': 'cachopada'});
    this.vis.map.layers.last().table.sqlView = 'wadus';

    expect($(this.header.el).find('.description p').text()).toEqual('cachopada')
  })

  it("should add default tag button text when no tags", function() {
    this.vis.set("tags", null)
    expect($(this.header.el).find('.tags a').html()).toEqual(this.header._TEXTS.tags.add)
  })

  it("should not remove tag button text when sql applied", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    expect($(this.header.el).find('.tags a').html()).toBeTruthy();
  })

  it("should add tags", function() {
    this.vis.set({'tags': ['cachopo','frixuelu'] });
    expect($(this.header.el).find('.tags a').html()).toEqual('2 tags');
  })

  it("should change tags button when there are tags", function() {
    this.vis.set({'tags': ['cachopo','frixuelu'] });
    expect($(this.header.el).find('.tags a').html()).toEqual('2 tags')
  })

  it("should add the class empty when there are no tags", function() {
    this.vis.set({'tags': []});
    expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(true);
  })

  it("should remove the class empty when there are no tags", function() {
    this.vis.set({'tags': [] });
    this.vis.set({'tags': ['PACHOPE'] });
    expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(false);
  })

  it("should add the privacy class on the status selector link", function() {
    this.vis.set('privacy', 'public');
    expect($(this.header.el).find('.privacy').hasClass('public')).toBeTruthy();
  })

  it("should remove the previous privacy class when the status change", function() {
    this.vis.set('privacy', 'private');
    expect($(this.header.el).find('.privacy').hasClass('public')).toBeFalsy();
  })

  it("should render a table icon if the visualization is table type", function() {
    expect($(this.header.el).find('.type').hasClass('table')).toBeTruthy();
  })

  it("should allow to set the back link to tables", function() {
    this.vis.set('type', 'table');
    expect($(this.header.el).find('.back').attr('href')).toEqual("/dashboard/tables");
  })

  it("should allow to set the back link to visualizations", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.back').attr('href')).toEqual("/dashboard/visualizations");
  })

  it("should render a visualization icon if the visualization is derived type", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.type').hasClass('derived')).toBeTruthy();
  })

  it("should show visualize button when visualization type is table", function() {
    expect($(this.header.el).find('.share span').text()).toBe('VISUALIZE');
  })

  it("should change share button when visualization type is derived", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.share span').text()).toBe('SHARE');
  });

  it("should apply a disabled class to all editable fields when a query is applied", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    // Simulate select new dataLayer
    this.header.setActiveLayer({
      model: this.vis.map.layers.last()
    });
    expect($(this.header.el).find('span.tags a').hasClass('disabled')).toBeTruthy();
    expect($(this.header.el).find('div.description a').length).toBe(0);
    expect($(this.header.el).find('h1 a').hasClass('disabled')).toBeTruthy();
  });

  it("shouldn't apply a disabled class to all editable fields when a query is not applied", function() {
    this.vis.map.layers.last().table.sqlView = '';
    // Simulate select new dataLayer
    this.header.setActiveLayer({
      model: this.vis.map.layers.last()
    });
    expect($(this.header.el).find('span.tags a').hasClass('disabled')).toBeFalsy();
    expect($(this.header.el).find('div.description a').length).toBe(1);
    expect($(this.header.el).find('h1 a').hasClass('disabled')).toBeFalsy();
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

});
