describe("edit feature fields dialog", function() {

  var view, model, table, row;
  beforeEach(function() {
    table = new cdb.admin.CartoDBTableMetadata({
      name: 'test',
      schema: [
        ['cartodb_id', 'number'],
        ['c1', 'string'],
        ['c2', 'number'],
        ['c3', 'boolean'],
        ['c4', 'date']
      ]
    });

    view = new cdb.admin.EditFeatureFields({
      model: new cdb.admin.Row({
        cartodb_id: '1',
        c1: 'jamon',
        c2: 10,
        c3: false,
        c4: '2012-10-10T10:10:10+02:00',
      }),
      table: table
    });
  });

  it("should render 4 fields", function() {
    view.render();
    expect(view.$('.wrapper > .field').size()).toBe(4);
  });

  it("should save the changes if edits a field correctly", function() {
    view.render();
    spyOn(view, 'hide');

    var $textarea = view.$el.find('textarea');

    $textarea
      .val('testing')
      .trigger(jQuery.Event( 'keydown', {
        Ctrl: true,
        metaKey: true,
        keyCode: 13
      }));

    expect(view.hide).toHaveBeenCalled();
  })

  it('should render unknown column types as string', function() {
    table.set({'schema': [['cartodb_id', 'number'],['c1', 'who knows']] });
    view.model.set('c1', 'ay');

    view.render();
    expect(view.$('div.field:eq(0) label').text()).toBe('c1');
    expect(view.$('div.field:eq(0) textarea.string_field').length).toBe(1);
    expect(view.$('div.field:eq(0) textarea.string_field').text()).toBe('ay');
  })

  it("should not save the changes if edits a field badly", function() {
    view.render();
    
    spyOn(view, 'hide');
    spyOn(view, '_scrollToError');

    var $input = view.$el.find('input.number_field');

    $input
      .val('testing')
      .trigger(jQuery.Event( 'keyup' ));

    view._ok();

    expect(view._scrollToError).toHaveBeenCalled();
    expect(view.hide).not.toHaveBeenCalled();
  })
});
