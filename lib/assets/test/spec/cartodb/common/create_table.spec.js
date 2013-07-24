// describe("Create table dialog", function() {

//   var dialog;

//   afterEach(function() {
//     console.log(dialog);
//     dialog.clean();
//   });

//   beforeEach(function() {

//     // Create a new dialog
//     dialog = new cdb.admin.CreateTableDialog({
//       tables : new cdb.admin.Tables(),
//       files: null,
//       url: null,
//       private_tables: true,
//       quota: 0
//     });
//   });

//   it("should allow to use FTP URIs", function() {
//     $("body").append(dialog.render().el);

//     var url  = "ftp://ftp2.census.gov/geo/tiger/TIGER2011/TRACT/tl_2011_08_tract.zip";

//     result = dialog._checkURL(url);

//     expect(result).toEqual(true);
//   });

//   it("should render the tabs properly if import is selected", function() {
//     $("body").append(dialog.render().el);

//     expect(dialog.$('.dialog-tabs').length).toBe(1);
//     expect(dialog.$('.dialog-tabs').css('display')).toBe('block');
//     expect(dialog.$('.dialog-tab').length).toBe(3);
//   });

//   it("should change tabs properly", function() {
//     // $("body").append(dialog.render().el);

//     // dialog.$('.file').hasClass('selected').toBeTruthy();
//     // dialog.$('.gdrive').click();
//     // dialog.$('.file').hasClass('selected').toBeFalsy();
//     // dialog.$('.gdrive').hasClass('selected').toBeTruthy();
//   });



//   it("should have a switch", function() {
//     $("body").append(dialog.render().el);
//     dialog.open();

//     expect(dialog.$el.find(".switch")).toBeDefined();
//   });

//   it("should allow to change the privacy", function() {
//     $("body").append(dialog.render().el);

//     dialog.open();
//     expect(dialog.model.get("private")).toBeTruthy();

//     dialog.$el.find(".switch").click();
//     expect(dialog.model.get("private")).toBeFalsy();

//     // Check label
//     dialog.$el.find(".privacy label").click();
//     expect(dialog.model.get("private")).toBeTruthy();

//   });

  

//   it("should change the text of the button when choosing 'Start from scratch'", function() {
//     $("body").append(dialog.render().el);

//     dialog.open();

//     dialog.$el.find("li.option[data-option='2'] > a").click();
//     expect(dialog.$el.find(".button.ok").text()).toEqual("Create empty table");

//     dialog.$el.find("li.option[data-option='0'] > a").click();
//     expect(dialog.$el.find(".button.ok").text()).toEqual("Create table");

//   });


// });

// /*

// describe("Create table dialog (FREE)", function() {
//   var dialog;

//   afterEach(function() {
//     dialog.clean();
//   });

//   beforeEach(function() {

//     // Create a new dialog
//     dialog = new cdb.admin.CreateTableDialog({
//       tables : new cdb.admin.Tables(),
//       files: null,
//       url: null,
//       private_tables: false,
//       quota: 0
//     });

//   });

//   it("should show the switch disable by default", function() {
//     $("body").append(dialog.render().el);
//     dialog.open();

//     expect(dialog.$el.find(".switch").hasClass("disabled")).toBeTruthy();

//   });

//   it("shouldn't allow to change the privacy", function() {
//     $("body").append(dialog.render().el);
//     dialog.open();
//     expect(dialog.model.get("private")).toBeFalsy();

//     dialog.$el.find(".switch").click();
//     expect(dialog.model.get("private")).toBeFalsy();

//     // Check label
//     dialog.$el.find(".privacy label").click();
//     expect(dialog.model.get("private")).toBeFalsy();

//   });
// });

// */
