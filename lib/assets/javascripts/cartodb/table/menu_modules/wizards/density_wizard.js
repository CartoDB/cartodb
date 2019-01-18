cdb.admin.mod.DensityWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ['legends'],

  initialize: function() {
    this.type = 'density';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
  },

  _generateSQL: function() {
    var self = this;
    var table = self.options.table;
    var prop = 'cartodb_id';
    var zoom = self.options.map.get('zoom');

    // we generate a grid and get the number of points
    // for each cell. With that the density is generated
    // and calculated for zoom level 10, which is taken as reference when we calculate the quartiles for the style buclets
    // see models/carto.js
    if(this.cartoProperties.get('geometry_type') === 'Rectangles') {
      self.sql = _.template("WITH hgrid AS (SELECT CDB_RectangleGrid(ST_Expand(!bbox!, greatest(!pixel_width!,!pixel_height!) * <%= size %>), greatest(!pixel_width!,!pixel_height!) * <%= size %>, greatest(!pixel_width!,!pixel_height!) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.<%=prop%>) as points_count,count(i.<%=prop%>)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 )  as points_density, 1 as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell")({
        prop: prop,
        table: '__wrapped',
        size: this.cartoProperties.get('polygon-size'),
        z: zoom
      });

    } else {
      self.sql = _.template("WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, greatest(!pixel_width!,!pixel_height!) * <%= size %>), greatest(!pixel_width!,!pixel_height!) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.<%=prop%>) as points_count, count(i.<%=prop%>)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as points_density, 1 as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell")({
        prop: prop,
        table: '__wrapped',
        size: this.cartoProperties.get('polygon-size'),
        z: zoom
      });
    }
    return this.sql;
  }

});

