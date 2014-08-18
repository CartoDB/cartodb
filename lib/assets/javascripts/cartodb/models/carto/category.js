cdb.admin.carto = cdb.admin.carto || {};

cdb.admin.carto.category = {
  max_values: 10,
  others_value: "Others",

  /**
   *  New category generator. It replaces Color wizard
   */
  category_generator: function(table, props, changed, callback) {

    var self = this;

    var type = table.geomColumnTypes() && table.geomColumnTypes()[0] || "polygon";


    // Get fill cartocss parameter
    var fill = 'polygon-fill';
    switch (type) {
      case 'polygon': fill = 'polygon-fill'; break;
      case 'line':    fill = 'line-color'; break;
      default:        fill = 'marker-fill';
    }

    // Generate default styles
    var table_name = table.getUnqualifiedName();
    var css = '#' + table_name + " {\n";

    var cartocss_props = manage_carto_properies(props);

    for (var i in cartocss_props) {
      if (i !== "categories" && i !=="colors" &&  i !== "property") {
        css +=  "   " + i + ": " + props[i] + ";\n";
      }
    }

    // Close defaults
    css += "}\n";

    if (props.colors && !props.categories) {
      colors_to_categories();
    } else if (changed.property || !props.categories || props.categories.length === 0) {
      this.get_categories(props, table, function(colors) {
        callback(css + self.generate_categories(props, table, colors), colors);
      });
    } else {
      callback(css + this.generate_categories(props, table, colors), colors);
    }

    // Transform colors values to categories array
    function colors_to_categories() {
      var colors = [];

      // Generate categories metadata
      for (var i in props.colors) {
        var obj = {};
        var color = props.colors[i];

        obj.title = (i < this.max_values) ? color[0] : this.others_value;
        obj.title_type = color[2];
        obj.color = color[1];
        obj.value_type = 'color';

        if (i >= this.max_values) {
          obj["default"] = true;
        }

        colors.push(obj);
      }

      callback(css + self.generate_categories(props, table, colors), colors);
    }

  },

  // Get values with default colors from the sql
  get_categories: function(props, table, callback) {

    var self = this;
    table.data().categoriesForColumn(this.max_values, props.property, function(cat) {
      var column_type = cat.type;
      var categories = cat.categories;
      var colors = [];

      // Generate categories metadata
      for (var i in categories) {
        var obj = {};
        obj.title = (i < self.max_values) ? categories[i]: self.others_value;
        obj.title_type = column_type;
        obj.color = cdb.admin.color_brewer[i];
        obj.value_type = 'color';

        if (i >= self.max_values) {
          obj["default"] = true;
        }
        colors.push(obj);
      }
      callback(colors);
    });
  },

  // Generate categories css 
  generate_categories: function(props, table, metadata) {

    function _normalizeValue(v) {
      return v.replace(/\n/g,'\\n')
              // .replace(/\'/g, "\\'") // Not necessary right now becuase tiler does it itself.
              .replace(/\"/g, "\\\"");
    }

    var table_name = table.getUnqualifiedName();
    var css = '';
    var type = table.geomColumnTypes() && table.geomColumnTypes()[0] || "polygon";
    var categories = metadata || props.categories;
    if (categories && table.containsColumn(props.property)) {
      // type of the column, number -> no quotes, string -> quotes, boolean -> no quotes
      for (var i in categories) {

        var category = categories[i][categories[i].value_type];
        var fill = 'polygon-fill';

        switch (type) {
          case 'polygon': fill = (categories[i].value_type == "file") ? 'polygon-pattern-file' : 'polygon-fill'; break;
          case 'line':    fill = (categories[i].value_type == "file") ? 'line-pattern-file' : 'line-color'; break;
          default:        fill = (categories[i].value_type == "file") ? 'marker-file' : 'marker-fill';
        }

        if (categories[i]["default"]) {
          // Default category
          css += "\n#" + table_name + " {\n   " + fill + ": " + category + ";\n}";
        } else {
          // Set correct value type
          var value = '';
          if (categories[i].title_type != "string" || categories[i].title === null) {
            value = categories[i].title;
          } else {
            value = "\"" + _normalizeValue(categories[i].title) + "\"";
          }

          // Custom category
          css += "\n#" + table_name + "[" + props.property + "=" + value + "] {\n   " + fill + ": " + category + ";\n";

          // Trick!
          // When polygon-pattern-file is applied, we have to
          // remove the polygon fill opacity and apply polygon-pattern-opacity (-:(·):-)
          if (type === "polygon" && fill === "polygon-pattern-file") {
            css += "   polygon-opacity:0;\n";
            css += "   polygon-pattern-opacity:" + (props['polygon-opacity'] || 1) + ";\n";
          }

          css += "}";
        }
      }
    }

    return css;
  }

}
