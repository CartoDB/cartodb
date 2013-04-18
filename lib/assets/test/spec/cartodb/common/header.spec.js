describe("Visualization Header tests", function() {

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
        <li><%= link_to "Back", root_path, :class => "back" %></li>\
        <li><span class="type">T</span></li>\
        <li><h1><a href="#/change-title" class="title"></a></h1></li>\
        <li><a href="#/clearview" class="clearview button_header rounded white">clear view</a></li>\
        <li><a href="#/change-status" class="status button_header rounded white"></a></li>\
        <li><span class="tags"></span></li>\
      </ul>\
      <div class="description">\
        <p><a href="#/change-description"></a></p>\
      </div>\
      <nav>\
        <a href="/table" class="smaller strong tab selected">Table</a>\
        <a href="/map" class="smaller strong tab">Map view</a>\
      </nav>\
    </div>\
    <div class="right">\
      <ul class="options">\
        <li><a href="#/visualize" class="rounded orange share">visualize</a></li>\
      </ul>\
    </div></header>');

    // New visualization header
    this.header = new cdb.admin.Header({
      el: this.$header,
      globalError: { showError: {} },
      model: this.vis,
      user: this.user,
      config: TestUtil.config,
      geocoder: {}
    });
  })

  afterEach(function() {
    this.header.clean();
    this.$header.remove();
  });

  it("should contain a change title link", function() {
    expect(this.header.$el.find('.title').length).toBeTruthy();
  })

  it("should create the title change dialog on click", function() {
    $(this.header.el).find('.title').click();
    waits(25);
    expect(this.header.title_dialog).toBeTruthy();
    $('.edit_name_dialog').remove();
  })

  it("should not let the user change the visualization/table name when the table is not writable", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.title').click();
    waits(25);
    expect(this.header.title_dialog).toBeFalsy();
  })

  it("should open description_dialog on click", function() {
    $(this.header.el).find('.description p a').click();
    waits(25);
    expect(this.header.description_dialog).toBeTruthy();
    this.header.description_dialog.clean();
  })

  it("should not open description_dialog on click when sql aplied", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.description a').click();
    waits(25);
    expect(this.header.description_dialog).toBeFalsy();
  })

  it("should open tags dialog on click", function() {
    $(this.header.el).find('.tags a').click();
    waits(25);
    expect(this.header.tags_dialog).toBeTruthy();
    this.header.tags_dialog.clean();
  })

  it("should not open tags dialog on click when sql aplied", function() {
    this.vis.map.layers.last().table.sqlView = 'wadus';
    $(this.header.el).find('.tags a').click();
    waits(25);
    expect(this.header.tags_dialog).toBeFalsy();
  });

  it("should add default description when no description", function() {
    this.vis.set('description', null);
    expect($(this.header.el).find('.description p a').text()).toEqual(this.header._TEXTS._DEFAULT_DESCRIPTION)
  });

  it("should add table description ", function() {
    this.vis.set({'description': 'cachopada'});
    expect($(this.header.el).find('.description p a').html()).toEqual('cachopada')
  })

  it("should add table description even when there's an sql ", function() {
    this.vis.set({'description': 'cachopada'});
    this.vis.map.layers.last().table.sqlView = 'wadus';

    expect($(this.header.el).find('.description p').text()).toEqual('cachopada')
  })

  it("should add default tag button text when no tags", function() {
    this.vis.set("tags", null)
    expect($(this.header.el).find('.tags a').html()).toEqual(this.header._TEXTS._TAGS._ADD)
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

  it("should render the privacy", function() {
    expect($(this.header.el).find('.status').html()).toEqual('PUBLIC')
  })

  it("should update the privacy when changed", function() {
    this.vis.set('privacy', 'public');
    expect($(this.header.el).find('.status').html()).toEqual('public')
  })

  it("should add the privacy class on the status selector link", function() {
    this.vis.set('privacy', 'public');
    expect($(this.header.el).find('.status').hasClass('public')).toBeTruthy();
  })

  it("should remove the previous privacy class when the status change", function() {
    this.vis.set('privacy', 'public');
    expect($(this.header.el).find('.status').hasClass('private')).toBeFalsy();
  })

  it("should render a table icon if the visualization is table type", function() {
    expect($(this.header.el).find('.type').hasClass('table')).toBeTruthy();
  })

  it("should render a visualization icon if the visualization is derived type", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.type').hasClass('derived')).toBeTruthy();
  })

  it("should show visualize button when visualization type is table", function() {
    expect($(this.header.el).find('.share').hasClass('orange')).toBeTruthy();
    expect($(this.header.el).find('.share').text()).toBe('VISUALIZE');
  })

  it("should change share button when visualization type is derived", function() {
    this.vis.set('type', 'derived');
    expect($(this.header.el).find('.share').hasClass('green')).toBeTruthy();
    expect($(this.header.el).find('.share').text()).toBe('PUBLISH');
  })

  it("should show a dialog if clicks over share button", function() {
    $(this.header.el).find('.share').click();
    waits(25);
    expect(this.header.share_dialog).toBeTruthy();
    this.header.share_dialog.clean();
  })
});