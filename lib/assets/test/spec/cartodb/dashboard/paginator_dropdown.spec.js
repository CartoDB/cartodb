/*describe("PaginatorDropdown", function() {

  var dropdown;

  afterEach(function() {
    //paginator.$el.remove();
  });

  beforeEach(function() {

      [>this.filterTag = new cdb.admin.TagDropdown({
        className:         'dropdown tag_dropdown border',
        target:            $(".filter"),
        tags:              this.tags,
        tables:            this.tables,
        visualizations:    this.visualizations,
        host:              this.options.config.account_host,
        vertical_offset:   8,
        horizontal_offset: 5,
        template_base:     'common/views/tag_dropdown'
      });

<]
    this.$el = $('<div></div>');
    this.$el.appendTo($('body'));

    // Choose scenario
    dropdown = new cdb.admin.PaginatorDropdown({
      template_base:     'dashboard/views/paginator_dropdown',
      pages: [1,2,3,4],
      target:            $(".filter"),
    });

    this.$el.append(dropdown.render().el);

  });

  it("should render the dropdown", function() {
  });


});*/
