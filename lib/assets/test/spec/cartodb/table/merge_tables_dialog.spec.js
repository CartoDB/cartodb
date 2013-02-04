describe("[CT] ColumnSelector", function() {

  var selector;
  var spy, listener;

  beforeEach(function() {

    var model = new cdb.admin.ColumnSelectorModel({
      name:           "name",
      joinType:       "regular",
      keySelected:    false,
      switchSelected: true
    });

    selector = new cdb.admin.ColumnSelector({
      model: model
    });

    listener = {
      listen: function() {}
    };

    spy = spyOn(listener, "listen");

  });

  it("should enable the radio button when the joinType is regular and the field is not 'the_geom'", function() {
    selector.render();
    expect(selector.model.get("enabled")).toBeTruthy();
  });

  it("shouldn't enable the radio button when the joinType is regular and the field is the_geom'", function() {
    selector.render();
    selector.model.set({ joinType: "regular", name: "the_geom" });
    selector._setKeyColumnEnabled();

    expect(selector.model.get("enabled")).toBeFalsy();
  });

  it("should enable the radio button when the joinType is spatial and the field is 'the_geom'", function() {
    selector.render();
    selector.model.set({joinType: "spatial", name: "the_geom" });
    selector._setKeyColumnEnabled();

    expect(selector.model.get("enabled")).toBeTruthy();
  });

  it("shouldn't enable the radio button when the joinType is spatial and the field is not 'the_geom'", function() {
    selector.render();
    selector.model.set({ joinType: "spatial", name: "description" });
    selector._setKeyColumnEnabled();

    expect(selector.model.get("enabled")).toBeFalsy();
  });

  it("should trigger an event when the user clicks in a radiobutton", function() {
    selector.render();

    selector.bind("keyColumn", listener.listen);

    selector.$el.find(".radiobutton").trigger("click");

    expect(spy).toHaveBeenCalled();

  });

  it("should allow to click in the radio button", function() {
    selector.render();

    selector.$el.find(".radiobutton").trigger("click");
    expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();

  });

  it("should allow to select the radio button", function() {
    selector.render();

    selector.model.set("keySelected", true);
    expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();

  });

  it("should allow to enable/disable the switch", function() {
    selector.render();

    selector.model.set("switchSelected", true);
    expect(selector.$el.find(".switch").hasClass("enabled")).toBeTruthy();
    expect(selector.$el.find(".switch").hasClass("disabled")).toBeFalsy();

    selector.model.set("switchSelected", false);
    expect(selector.$el.find(".switch").hasClass("enabled")).toBeFalsy();
    expect(selector.$el.find(".switch").hasClass("disabled")).toBeTruthy();

  });

  it("should allow to enable/disable the radio button", function() {
    selector.render();

    selector.model.set("enableRadio", true);
    expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeFalsy();

    selector.model.set("enableRadio", false);
    expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeTruthy();

  });

  it("should allow to show/hide the radio button", function() {
    selector.render();

    selector.model.set("showRadio", true);
    expect(selector.$el.find(".radiobutton .radio").hasClass("hidden")).toBeFalsy();

    selector.model.set("showRadio", false);
    expect(selector.$el.find(".radiobutton .radio").hasClass("hidden")).toBeTruthy();

  });

  it("should allow to show/hide the switch button", function() {
    selector.render();

    selector.model.set("showSwitch", true);
    expect(selector.$el.find(".switch").hasClass("hidden")).toBeFalsy();

    selector.model.set("showSwitch", false);
    expect(selector.$el.find(".switch").hasClass("hidden")).toBeTruthy();

  });

});

describe("[CT] TableColumnSelector", function() {

  var selector, table;
  var onStateChangeSpy;

  beforeEach(function() {

    var schema = [ ['test', 'number'], ['test2', 'string'], ['the_geom', 'geometry'] ];

    table = TestUtil.createTable('test', schema);

    selector = new cdb.admin.TableColumnSelector ({
      model: table
    });

  });

  it("should open the dialog", function() {
    selector.render();
    expect(selector.$el.length > 0).toEqual(true);
  });

});

describe("[CT] MergeTablesDialogEvents", function() {

  var dialog, table;

  var onStateChangeSpy, onRadioButtonClicked;

  beforeEach(function() {

    table = TestUtil.createTable('test');

    onStateChangeSpy     = spyOn(cdb.admin.MergeTablesDialog.prototype, '_onChangeState');
    onRadioButtonClicked = spyOn(cdb.admin.MergeTablesDialog.prototype, '_onRadioClick');

    dialog = new cdb.admin.MergeTablesDialog ({
      model: table
    });

  });

  it("should trigger a changeState method when the state is changed ", function() {
    dialog.model.set("state", 1);
    expect(onStateChangeSpy).toHaveBeenCalled();
  });

  it("should trigger event when one of the radio buttons are clicked", function() {
    dialog.render();

    var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
    $radiobutton.trigger("click");

    expect(onRadioButtonClicked).toHaveBeenCalled();

  });
});

describe("[CT] MergeTablesDialog", function() {

  var dialog, table;

  beforeEach(function() {

    var schema = [
      ['test', 'number'],
      ['test2', 'string'],
      ['the_geom', 'geometry']
    ];

    table = TestUtil.createTable('test', schema);

    dialog = new cdb.admin.MergeTablesDialog ({
      model: table
    });

  });

  it("should open the dialog", function() {
    dialog.render();
    expect(dialog.$el.length > 0).toEqual(true);
  });

  it("should have title", function() {
    dialog.render();
    expect(dialog.$el.find("section:first-child .head > h3").text()).toEqual("Merge with another table");
  });

  it("should have two selector tables", function() {
    dialog.render();

    expect(dialog.actual_table).toBeDefined();
    expect(dialog.merge_table).toBeDefined();
  });

  it("should have a description", function() {
    dialog.render();

    expect(dialog.$description).toBeDefined();
    expect(dialog.$description.length > 0).toBeTruthy();
    expect(dialog.$description.text()).toEqual('Merges are really usefull when you want to get data from two tables together in a single one. Select your join strategy to perform a merge.');

  });

  it("should have a description title", function() {
    dialog.render();

    expect(dialog.$descriptionTitle).toBeDefined();
    expect(dialog.$descriptionTitle.length > 0).toBeTruthy();
    expect(dialog.$descriptionTitle.text()).toEqual('');

  });

  it("should have a next button", function() {
    dialog.render();

    expect(dialog.$next).toBeDefined();
    expect(dialog.$next.length > 0).toBeTruthy();
    expect(dialog.$next.text()).toEqual('Next');
  });

  it("should have a back button", function() {
    dialog.render();

    expect(dialog.$back).toBeDefined();
    expect(dialog.$back.length > 0).toBeTruthy();
    expect(dialog.$back.text()).toEqual('Go back');
  });

  it("should have a list of merge options", function() {
    dialog.render();

    expect(dialog.$mergeFlavorList).toBeDefined();
    expect(dialog.$mergeFlavorList.length > 0).toBeTruthy();
  });

  it("should have a table selector", function() {
    dialog.render();

    expect(dialog.$tableSelector).toBeDefined();
    expect(dialog.$tableSelector.length > 0).toBeTruthy();
  });

  it("next button should be disabled on the begining", function() {
    dialog.render();
    expect(dialog.$next.hasClass('disabled')).toBeTruthy();
  });

  it("back button should be hidden on the begining", function() {
    dialog.render();
    expect(dialog.$back).toBeHidden();
    expect(dialog.$back.hasClass("hidden")).toBeTruthy();
  });

  it("should increase the state value when clicking the enabled next button", function() {
    dialog.render();
    dialog.model.set("enableNext", true);

    dialog.$next.click();

    expect(dialog.model.get("state")).toEqual(1);
  });

  it("should decrease the state value when clicking the enabled back button", function() {
    dialog.render();
    dialog.model.set("enableBack", true);
    dialog.model.set("state", 1);

    dialog.$back.click();

    expect(dialog.model.get("state")).toEqual(0);
  });

  it("shouldn't increase the state value when clicking the disabled next button", function() {
    dialog.render();

    dialog.model.set("enableNext", false);
    dialog.$next.click();

    expect(dialog.model.get("state")).toEqual(0);
  });

  it("should load the next step when the user clicks in the next button", function() {
    dialog.render();

    dialog.model.set("enableNext", true);
    dialog.model.set("merge_flavor", "regular");

    dialog.$next.click();

    //expect(dialog.$el.find(".content").attr("data-name")).toEqual("regular-" + dialog.model.get("state"));
  });

  it("should disable the next button when the user clicks in the next button", function() {
    dialog.render();

    dialog.model.set("enableNext", true);
    dialog.model.set("merge_flavor", "regular");

    dialog.$next.click();

    expect(dialog.model.get("enableNext")).toEqual(false);
  });

  /*
  it("should allow to show/hide the merge flavor list", function() {
  dialog.render();

  dialog.model.set("show_merge_flavor_list", true);
  expect(dialog.$el.find(".join_types").length > 0).toBeTruthy();

  dialog.model.set("show_merge_flavor_list", false);
  expect(dialog.$el.find(".join_types").length > 0).toEqual(false);

  });

  it("should allow to show/hide the table selector", function() {
  dialog.render();

  dialog.model.set("show_table_selector", true);
  expect(dialog.$tableSelector.length > 0).toBeTruthy();

  dialog.model.set("show_table_selector", false);
  expect(dialog.$tableSelector.length > 0).toBeFalsy();

  });
  */

  it("should allow to enable/disable the next button", function() {
    dialog.render();

    dialog.model.set("enableNext", true);
    expect(dialog.$next.hasClass("disabled")).toBeFalsy();

    dialog.model.set("enableNext", false);
    expect(dialog.$next.hasClass("disabled")).toBeTruthy();

  });

  it("should allow to show/hide the back button", function() {
    dialog.render();

    dialog.model.set("enableBack", true);
    expect(dialog.$back.not().hasClass("hidden")).toBeTruthy();

    dialog.model.set("enableBack", false);
    expect(dialog.$back.hasClass("hidden")).toBeTruthy();

  });

  it("should allow to change the description", function() {
    dialog.render();

    var text = "New description";
    dialog.model.set("description", text);
    expect(dialog.$description.text()).toEqual(text);

  });

  it("should allow to change the description title", function() {
    dialog.render();

    var text = "New title";
    dialog.model.set("description_title", text);
    expect(dialog.$descriptionTitle.text()).toEqual(text);

  });

  it("should allow to change the text of the next button", function() {
    dialog.render();

    var text = "Ok";

    dialog.model.set("nextButtonText", text);
    expect(dialog.$next.text()).toEqual(text);

  });

  it("should select the clicked radiobutton", function() {
    dialog.render();

    var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
    $radiobutton.click();

    expect($radiobutton.hasClass("selected")).toBeTruthy();

  });

  it("should unselect not clicked radiobuttons", function() {
    dialog.render();

    var $radiobutton      = dialog.$el.find("li:first-child .radiobutton");
    var $otherRadioButton = dialog.$el.find("li:last-child .radiobutton");

    $radiobutton.click();

    expect($otherRadioButton.hasClass("selected")).toBeFalsy();

  });

  it("should enable the next option when a radiobutton is selected", function() {
    dialog.render();

    var $radiobutton = dialog.$el.find("li:first-child .radiobutton");
    $radiobutton.click();

    expect(dialog.model.get("enableNext")).toBeTruthy();

  });

  it("should set the flavor of the merge when a radiobutton is selected", function() {
    dialog.render();

    dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
    expect(dialog.model.get("merge_flavor")).toEqual("regular");

    dialog.$el.find(".radiobutton[data-merge-flavor='spatial']").click();
    expect(dialog.model.get("merge_flavor")).toEqual("spatial");

  });

  it("should set the flavor of the merge in the selector tables", function() {
    dialog.render();

    dialog.$el.find(".radiobutton[data-merge-flavor='regular']").click();
    expect(dialog.actual_table.options.joinType).toEqual("regular");
    expect(dialog.merge_table.options.joinType).toEqual("regular");

    dialog.$el.find(".radiobutton[data-merge-flavor='spatial']").click();
    expect(dialog.actual_table.options.joinType).toEqual("spatial");
    expect(dialog.merge_table.options.joinType).toEqual("spatial");

  });

});
