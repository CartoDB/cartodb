// describe("cdb.admin.Header", function() {

//   beforeEach(function() {
//     this.table = TestUtil.createTable();
//     this.table.set({'description':''});
//     this.user = TestUtil.createUser();
//     this.container = $('<div><a href="" class="change_title"></a>'+
//       '<div class="table_description"><p></p></div>'+
//       '<a class="status"></a>'+
//       '<span class="tags"><a href="#add_tags">add tags</a></span>'+
//       '</div>');
//     this.header = new cdb.admin.Header({
//       el: this.container,
//       $el: this.container,
//       model: this.table,
//       user: this.user,
//       map: this.map,
//       config: TestUtil.config,
//       body: this.container
//     });
//     this.table.trigger('change');

//   })

//   afterEach(function() {
//     this.header.clean();
//     this.container.remove();
//   });

//   it("should contain a change_title link", function() {
//     expect($(this.header.el).find('.change_title').length).toBeTruthy();
//   })


//   it("should create the title change dialog on click", function() {
//     $(this.header.el).find('.change_title').click();
//     waits(25);
//     expect(this.header.title_dialog).toBeTruthy();
//     $('.edit_name_dialog').remove();
//   })

//   it("should not let the user change the table name when the table is not writable", function() {
//     this.header.table.sqlView = 'wadus';
//     $(this.header.el).find('.change_title').click();
//     waits(25);
//     expect(this.header.title_dialog).toBeFalsy();
//   })

//   it("should open description_dialog on click", function() {
//     $(this.header.el).find('.table_description p').click();
//     waits(25);
//     expect(this.header.description_dialog).toBeTruthy();
//   })

//   it("should not open description_dialog on click when sql aplied", function() {
//     this.header.table.sqlView = 'wadus';
//     $(this.header.el).find('.table_description p').click();
//     waits(25);
//     expect(this.header.description_dialog).toBeFalsy();
//   })

//   it("should open tags dialog on click", function() {
//     $(this.header.el).find('.tags a').click();
//     waits(25);
//     expect(this.header.tags_dialog).toBeTruthy();
//   })

//   it("should not open tags dialog on click when sql aplied", function() {
//     this.header.table.sqlView = 'wadus';
//     $(this.header.el).find('.tags a').click();
//     waits(25);
//     expect(this.header.tags_dialog).toBeFalsy();
//   })

//   it("should add default description when no description", function() {
//     expect($(this.header.el).find('.table_description p').html()).toEqual(this.header._TEXTS._DEFAULT_DESCRIPTION)
//   })

//   it("sh0uld add table description ", function() {
//     this.table.save({'description': 'cachopada'});
//     expect($(this.header.el).find('.table_description p').html()).toEqual('cachopada')
//   })

//   it("sh0uld add table description even when there's an sql ", function() {
//     this.table.save({'description': 'cachopada'});
//     this.table.sqlView = 'wadus';

//     expect($(this.header.el).find('.table_description p').html()).toEqual('cachopada')
//   })

//   it("should add default tag button text when no tags", function() {
//     expect($(this.header.el).find('.tags a').html()).toEqual(this.header._TEXTS._DEFAULT_ADD_TAG_BUTTON)
//   })

//   it("should not remove tag button text when sql applied", function() {
//     this.table.sqlView = 'wadus';
//     this.table.trigger('change:dataSource');
//     expect($(this.header.el).find('.tags a').html()).toBeTruthy();
//   })

//   it("should add tags", function() {
//     this.table.save({'tags': 'cachopo,frixuelu'});
//     expect($(this.header.el).find('.tags a').html()).toEqual('2 tags');
//   })

//   it("should change tags button when there are tags", function() {
//     this.table.save({'tags': 'cachopo,frixuelu'});
//     expect($(this.header.el).find('.tags a').html()).toEqual('2 tags')
//   })

//   it("should add the class empty when there are no tags", function() {
//     this.table.save({'tags': ''});
//     expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(true);
//   })

//   it("should remove the class empty when there are no tags", function() {
//     this.table.save({'tags': ''});
//     this.table.save({'tags': 'cachopo'});

//     expect($(this.header.el).find('.tags').hasClass("empty")).toEqual(false);
//   })

//   it("should render the privacy", function() {
//     expect($(this.header.el).find('.status').html()).toEqual('private')
//   })

//   it("should add the privacy class to the status selector link", function() {
//     expect($(this.header.el).find('.status').hasClass('private')).toBeTruthy();
//   })

//   it("should update the privacy when changed", function() {
//     this.table.save({'privacy':'public'});
//     expect($(this.header.el).find('.status').html()).toEqual('public')
//   })

//   it("should add the privacy class on the status selector link", function() {
//     this.table.save({'privacy':'public'});
//     expect($(this.header.el).find('.status').hasClass('public')).toBeTruthy();
//   })

//   it("should remove the previous privacy  class when the status change", function() {
//     this.table.save({'privacy':'public'});
//     expect($(this.header.el).find('.status').hasClass('private')).toBeFalsy();
//   })



// })
