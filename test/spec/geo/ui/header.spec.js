describe("common.geo.ui.Header", function() {

  var header, template;

  afterEach(function() {
    header.clean();
  });

  beforeEach(function() {

    template = cdb.core.Template.compile(
       ' \
      <div class="content">\
      <div class="title">{{{ title }}}</div>\
      <div class="description">{{{ description }}}</div>\
      </div>',
      'mustache'
    );

    header = new cdb.geo.ui.Header({
      model: new cdb.core.Model({
        extra: {
          title: 'Title',
          description: 'Description <a href="http://test.es">Test</a>',
          show_title: true,
          show_descriptin: true
        }
      }),
      template: template
    });
  });

  it("should render description links with target attribute included", function() {
    header.render();
    expect(header.$('.description a').attr('target')).toBe('_blank');
  });

  it("should not change target attribute if it was already set", function() {
    var h1 = new cdb.geo.ui.Header({
      model: new cdb.core.Model({
        extra: {
          title: 'Title',
          description: 'Description <a href="http://test.es" target="_parent">Test</a>',
          show_title: true,
          show_descriptin: true
        }
      }),
      template: template
    });

    h1.render();
    expect(h1.$('.description a').attr('target')).toBe('_parent');
  });

});
