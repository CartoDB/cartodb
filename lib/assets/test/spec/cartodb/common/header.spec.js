describe("cdb.admin.Header", function() {

  beforeEach(function() {
      this.table = TestUtil.createTable();
      this.user = TestUtil.createUser();
      this.container = $('<div><a href="" class="change_title"></a><div class="table_description"><p></p></div></div>')
      this.header = new cdb.admin.Header({
        el: this.container,
        model: this.table,
        user: this.user,
        map: this.map,
        config: TestUtil.config,
        body: this.container
      });

  })

  afterEach(function() {
    this.header.clean();
    this.container.remove();
  });

  it("should contain a change_title link", function() {
    expect($(this.header.el).find('.change_title').length).toBeTruthy();
  })


  it("should create the title change dialog on click", function() {
    $(this.header.el).find('.change_title').click();
    waits(25);
    expect(this.header.title_dialog).toBeTruthy();
  })

  it("should not let the user change the table name when the table is not writable", function() {
    this.header.table.sqlView = 'wadus';
    $(this.header.el).find('.change_title').click();
    waits(25);
    expect(this.header.title_dialog).toBeFalsy();
  })

  it("should open description_dialog on click", function() {
    $(this.header.el).find('.table_description p').click();
    waits(25);
    expect(this.header.description_dialog).toBeTruthy();
  })

  it("should not open description_dialog on click when sql aplied", function() {
    this.header.table.sqlView = 'wadus';
    $(this.header.el).find('.table_description p').click();
    waits(25);
    expect(this.header.description_dialog).toBeFalsy();
  })

})
