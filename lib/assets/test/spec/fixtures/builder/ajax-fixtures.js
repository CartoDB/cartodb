var ajaxFixtures = {
  querySchemaModel: {
    url: {
      http: new RegExp('^http(s)?.*/v2/sql.*sort_order=asc.rows_per_page=0')
    },
    response: {
      ok: {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: '{"rows":[],"fields":{"cartodb_id":{"type":"number"},"the_geom":{"type":"geometry"},"the_geom_webmercator":{"type":"geometry"},"name":{"type":"string"}},"total_rows":0}'
      }
    }
  },
  queryGeometryModel: {
    url: {
      http: new RegExp('^http(s)?.*/v2/sql.q=SELECT.CASE.LOWER.ST_GeometryType')
    },
    response: {
      ok: {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: '{"rows":[{"the_geom":"point"}]}'
      }
    }
  },
  queryRowsCollection: {
    url: {
      http: new RegExp('^http(s)?.*/v2/sql.rows_per_page=40')
    },
    response: {
      ok: {
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: '{"rows":[{"cartodb_id":611,"the_geom":{"type":"Point","coordinates":[-3.7,40.4]},"the_geom_webmercator":{"type":"Point","coordinates":[-413218.51279183,4926164.55366623]},"name":"In downtown"}]}'
      }
    }
  }
};

module.exports = ajaxFixtures;
