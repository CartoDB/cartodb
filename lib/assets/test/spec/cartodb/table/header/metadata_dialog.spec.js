describe("Metadata dialog", function() {

  var cartodb_layer, vis, user;

  beforeEach(function() {
    vis = new cdb.admin.Visualization({
      name:             "test_table",
      description:      "Table description",
      tags:             ["jam","testing"],
      privacy:          "PUBLIC",
      type:             "table"
    });

    cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

    vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      cartodb_layer
    ]);

    user = TestUtil.createUser();
    cartodb_layer.table.permission.owner = user;
    vis.permission.owner = user;

    view = new cdb.admin.MetadataDialog({
      vis: vis,
      user: user
    });
  });

  afterEach(function() {
    view.clean();
  });

  it("should render properly", function(done) {
    view.render();
    expect(view.$('input[name="name"]').val()).toBe('test_table');
    expect(view.$('textarea[name="description"]').val()).toBe('Table description');
    expect(view.$('input[name="source"]').val()).toBe('');
    expect(view.$('input[name="license"]').val()).toBe('');
    expect(view.$('ul li.tagit-choice').size()).toBe(2);
    expect(view.$('div.info.error').length).toBe(1);
    expect(view.$('div.owner').length).toBe(0);
    expect(view.$('div.foot input[type="submit"]').length).toBe(1);

    setTimeout(function() {
      expect(view.$('.jspContainer').length).toBe(1);
      done();
    },100)
  });

  it("should render owner block and disable all fields if table owner is different", function() {
    // Table
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.permission.owner = new_guy;

    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should disable all fields if table has a query applied", function() {
    // Table
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.permission.owner = new_guy;

    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should render owner block and disable all fields if vis owner is different", function() {
    // Vis
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.set('type', 'derived');
    vis.permission.owner = new_guy;
    
    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });

  it("should render owner block and disable all fields if vis owner is different", function() {
    // Vis
    var new_guy = new cdb.admin.User({ username: 'tests', id: 10 });
    cartodb_layer.table.permission.owner = new_guy;
    vis.set('type', 'derived');
    vis.permission.owner = new_guy;
    
    view.render();
    expect(view.$('div.owner').length).toBe(1);
    expect(view.$('input[name="name"]').is('[readonly]')).toBeTruthy();
    expect(view.$('textarea[name="description"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="source"]').is('[readonly]')).toBeTruthy();
    expect(view.$('input[name="license"]').is('[readonly]')).toBeTruthy();
    expect(view.$('ul.readonly').length).toBe(1);
    expect(view.$('div.foot input[type="submit"]').length).toBe(0);
  });




  // it("should let the user change the visualization/table tags when the table is syncable", function(done) {
  //   this.vis.map.layers.last().table.synchronization.set('id', 'test');
  //   $(this.header.el).find('span.tags > a').click();

  //   var self = this;

  //   setTimeout(function() {
  //     expect(self.header.tags_dialog).toBeTruthy();
  //     done();
  //   }, 25);

  // })

  // it("should let the user change the visualization/table description when the table is syncable", function(done) {
  //   this.vis.map.layers.last().table.synchronization.set('id', 'test');
  //   $(this.header.el).find('.description p a').click();

  //   var self = this;

  //   setTimeout(function() {
  //     expect(self.header.description_dialog).toBeTruthy();
  //     done();
  //   }, 25);

  // });

  // it("shouldn't apply a disabled class to all editable fields when a query is not applied", function() {
  //   this.vis.map.layers.last().table.sqlView = '';
  //   // Simulate select new dataLayer
  //   this.header.setActiveLayer({
  //     model: this.vis.map.layers.last()
  //   });
  //   expect($(this.header.el).find('span.tags a').hasClass('disabled')).toBeFalsy();
  //   expect($(this.header.el).find('div.description a').length).toBe(1);
  //   expect($(this.header.el).find('h1 a').hasClass('disabled')).toBeFalsy();
  // });

  // it("shouldn't let user change the table description when the table is in sql view (no matter if table is synced)", function(done) {
  //   this.vis.map.layers.last().table.sqlView = {
  //     isReadOnly: function() { return true; }
  //   }
  //   this.vis.map.layers.last().table.synchronization.set('id', 'test');
  //   $(this.header.el).find('.description p a').click();

  //   var self = this;

  //   setTimeout(function() {
  //     expect(self.header.description_dialog).toBeFalsy();
  //     done();
  //   }, 25);

  // });

  // it("shouldn't let user change the table tags when the table is in sql view (no matter if table is synced)", function(done) {
  //   this.vis.map.layers.last().table.sqlView = {
  //     isReadOnly: function() { return true; }
  //   }
  //   this.vis.map.layers.last().table.synchronization.set('id', 'test');
  //   $(this.header.el).find('span.tags > a').click();

  //   var self = this;

  //   setTimeout(function() {
  //     expect(self.header.tags_dialog).toBeFalsy();
  //     done();
  //   }, 25);

  // });


  // it("should open description_dialog on click", function(done) {
  //   $(this.header.el).find('.description p a').click();

  //   var self = this;

  //   setTimeout(function() {
  //     expect(self.header.description_dialog).toBeTruthy();
  //     self.header.description_dialog.clean();
  //     done();
  //   }, 25);
  // });

  // it("should not open description_dialog on click when sql aplied", function() {
  //   this.vis.map.layers.last().table.sqlView = {
  //     isReadOnly: function() { return true; }
  //   }
  //   $(this.header.el).find('.description a').click();
  //   expect(this.header.description_dialog).toBeFalsy();
  // })

  // it("should open tags dialog on click", function(done) {
  //   $(this.header.el).find('.tags a').click();

  //   var self = this;

  //   setTimeout(function(){
  //     expect(self.header.tags_dialog).toBeTruthy();
  //     self.header.tags_dialog.clean();
  //     done();
  //   }, 25);

  // })

  // it("should not open tags dialog on click when sql aplied", function(done) {
  //   this.vis.map.layers.last().table.sqlView = {
  //     isReadOnly: function() { return true; }
  //   }
  //   $(this.header.el).find('.tags a').click();

  //   var self = this;

  //   setTimeout(function(){
  //     expect(self.header.tags_dialog).toBeFalsy();
  //     done();
  //   }, 25);

  // });

  // it("should add default description when no description", function() {
  //   this.vis.set('description', null);
  //   expect($(this.header.el).find('.description p a').text()).toEqual(this.header._TEXTS.description.normal)
  // });

  // it("should add table description ", function() {
  //   this.vis.set({'description': 'cachopada'});
  //   expect($(this.header.el).find('.description p a').html()).toEqual('cachopada')
  // })

  // it("shouldn't add a table description if it's empty", function() {
  //   this.vis.set({'description': '              '});
  //   expect($(this.header.el).find('.description p a').html()).toEqual('add a description...');
  // })


  // it("should add table description even when there's an sql", function() {
  //   this.vis.set({'description': 'cachopada'});
  //   this.vis.map.layers.last().table.sqlView = 'wadus';

  //   expect($(this.header.el).find('.description p').text()).toEqual('cachopada')
  // })

  // it("should add default tag button text when no tags", function() {
  //   this.vis.set("tags", null)
  //   expect($(this.header.el).find('.tags a').html()).toEqual(this.header._TEXTS.tags.add)
  // })

  // it("should not remove tag button text when sql applied", function() {
  //   this.vis.map.layers.last().table.sqlView = 'wadus';
  //   expect($(this.header.el).find('.tags a').html()).toBeTruthy();
  // })

  // it("should add tags", function() {
  //   this.vis.set({'tags': ['cachopo','frixuelu'] });
  //   expect($(this.header.el).find('.tags a').html()).toEqual('2 tags');
  // })

  // it("should change tags button when there are tags", function() {
  //   this.vis.set({'tags': ['cachopo','frixuelu'] });
  //   expect($(this.header.el).find('.tags a').html()).toEqual('2 tags')
  // })

  // it("should add the class empty when there are no tags", function() {
  //   this.vis.set({'tags': []});
  //   expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(true);
  // })

  // it("should remove the class empty when there are no tags", function() {
  //   this.vis.set({'tags': [] });
  //   this.vis.set({'tags': ['PACHOPE'] });
  //   expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(false);
  // })

  // it("should apply a disabled class to all editable fields when a query is applied", function() {
  //   this.vis.map.layers.last().table.sqlView = {
  //     isReadOnly: function() { return true; }
  //   }

  //   // Simulate select new dataLayer
  //   this.header.setActiveLayer({
  //     model: this.vis.map.layers.last()
  //   });
  //   expect($(this.header.el).find('span.tags a').hasClass('disabled')).toBeTruthy();
  //   expect($(this.header.el).find('div.description a').length).toBe(0);
  //   expect($(this.header.el).find('h1 a').hasClass('disabled')).toBeTruthy();
  // });

});
