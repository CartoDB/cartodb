var ScratchView = require('../../../../../../javascripts/cartodb/common/dialogs/map/scratch_view');

describe('common/dialogs/map/scratch_view', function() {
  beforeEach(function() {

    this.table = new cdb.core.Model({
      name:           'citibike',
      row_count:      0,
      size:           1000,
      geometry_types: ['st_point']
    });

    this.vis = new cdb.admin.Visualization({
      name: 'my_dataset',
      type: 'table',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      table: this.table,
      permission: {
        owner: {
          base_url: 'http://team.carto.com/u/paco',
          username: 'paco'
        }
      }
    });

    this.view = new ScratchView({
      table: this.vis.get("table")
    });

    //var self = this;
    //this.view.bind("newGeometry", function(type)  {
      //self.z = type
    //}, this);


    this.view.render();
  });

  it('should render the view as expected', function() {
    expect(this.innerHTML()).toContain('Start by adding points, lines or polygons');
    expect(this.innerHTML()).toContain('Select the geometry type that you want to have in "citibike"');
    expect(this.innerHTML()).toContain('Add lines');
    expect(this.innerHTML()).toContain('Add points');
    expect(this.innerHTML()).toContain('Add polygon');
  });

  it('should trigger an event and send the correct type (point)', function() {

    var geometry_type;

    this.view.bind("newGeometry", function(type)  {
      geometry_type = type;
    }, this);

    this.view.$(".OptionCard[data-type='point']").click();
    expect(geometry_type).toBe('point');
  });

  it('should trigger an event and send the correct type (line)', function() {

    var geometry_type;

    this.view.bind("newGeometry", function(type)  {
      geometry_type = type;
    }, this);

    this.view.$(".OptionCard[data-type='line']").click();
    expect(geometry_type).toBe('line');
  });

  it('should trigger an event and send the correct type (polygon)', function() {

    var geometry_type;

    this.view.bind("newGeometry", function(type)  {
      geometry_type = type;
    }, this);

    this.view.$(".OptionCard[data-type='polygon']").click();
    expect(geometry_type).toBe('polygon');
  });

  afterEach(function() {
    this.view.clean();
  });
});
