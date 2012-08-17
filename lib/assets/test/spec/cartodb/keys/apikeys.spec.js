
describe("Api-keys", function() {

  beforeEach(function() {

    cdb.templates.add(new cdb.core.Template({
      name: 'common/views/settings_item',
      compiled: _.template('')
    }));
  });

  it("user menu template should appear", function() {
    
    var user_menu = this.user_menu = new cdb.admin.DropdownMenu({
      target: $('a.account'),
      model: {username: 'admin'},
      template_base: "common/views/settings_item"
    });

    expect(user_menu.template_base).not.toBeNull();
  });

});
