cdb.admin.carto = cdb.admin.carto || {};

cdb.admin.carto.torque_cat = {

  sql: function(categories, column) {
    function _normalizeValue(v) {
      return v.replace(/\n/g,'\\n').replace(/\"/g, "\\\"");
    }
    var s = ['select *, (CASE'];
    torque_cat = 1;
    for(var c in categories) {
      var cat = categories[c];
      var value;
      if (cat.title_type !== "string" || cat.title === null) {
        if (cat.title === cdb.admin.carto.category.others_value) {
          value = undefined;
        } else {
          value = cat.title;
        }
      } else {
        value = "\'" + _normalizeValue(cat.title) + "\'";
      }
      if (value !== undefined) {
        if (value === null) {
          s.push('WHEN "' + column + '" is ' + value + ' THEN ' + (torque_cat) );
        } else {
          s.push('WHEN "' + column + '" = ' + value + ' THEN ' + (torque_cat) );
        }
        torque_cat += 1;
      }
    }
    s.push('ELSE ' + torque_cat + ' END) as torque_category FROM __wrapped _cdb_wrap');
    return s.join(' ');
  },

  generate: function(table, props, changed, callback) {
    var self = this;

    // return torque cateogries form real categories
    function torque_categories(categories) {
      return _.map(categories, function(c, i) {
        c = _.clone(c);
        c.title = i + 1;
        c.title_type = 'number';
        return c;
      });
    }

    var cat = cdb.admin.carto.category;
    props['torque-aggregation-function'] = 'CDB_Math_Mode(torque_category)';
    cdb.admin.carto.torque.torque_generator(table, props, changed, function(css) {
      function gen(colors) {
          // modify to assign one integer for each cat
          var cats = torque_categories(colors);
          var sql = self.sql(colors, props.property_cat);
          callback(css + cat.generate_categories(props, table, cats, 'value'), colors, sql);
      }

      // if changed generate again if not reuse existing ones
      if (changed.property_cat || !props.categories || props.categories.length === 0) {
        cat.get_categories(props.property_cat, table, gen);
      } else {
        gen(props.categories);
      }
    });
  }

};
