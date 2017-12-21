cdb.admin.carto = cdb.admin.carto || {};

cdb.admin.carto.category = {
  max_values: 10,
  others_value: "Others",

  /**
   *  New category generator. It replaces Color wizard
   */
  category_generator: function(table, props, changed, callback) {

    var self = this;

    var type = table.geomColumnTypes() && table.geomColumnTypes()[0] || "polygon";


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

    if (changed.property || !props.categories || props.categories.length === 0) {
      this.get_categories(props.property, table, function(colors) {
        callback(css + self.generate_categories(props, table, colors), colors);
      });
    } else {
      callback(css + this.generate_categories(props, table, props.categories), props.categories);
    }
  },

  // Get values with default colors from the sql
  get_categories: function(property, table, callback) {

    var self = this;

    // We request an extra category to determine if we need to display the "Others" legend
    table.data().categoriesForColumn(this.max_values + 1, property, function(cat) {
      var column_type = cat.type;
      var showOthers = cat.categories.length > self.max_values;

      // Limit the categories we display and sort them alphabetically
      var categories = cat.categories.slice(0, self.max_values).sort();

      var colors = [];

      // Generate categories metadata
      for (var i in categories) {
        var obj = {};
        obj.title = categories[i];
        obj.title_type = column_type;
        obj.color = cdb.admin.color_brewer[i];
        obj.value_type = 'color';
        colors.push(obj);
      }
      if (showOthers) {
        colors.push({
          title: self.others_value,
          value_type: 'color',
          color: cdb.admin.color_brewer[categories.length],
          default: true
        })
      }
      callback(colors);
    });
  },

  // Generate categories css 
  generate_categories: function(props, table, metadata, property_name) {
    property_name = property_name || props['property'];

    function _normalizeValue(v) {
      return v.replace(/\n/g,'\\n')
              // .replace(/\'/g, "\\'") // Not necessary right now becuase tiler does it itself.
              .replace(/\"/g, "\\\"");
    }

    var table_name = table.getUnqualifiedName();
    var css = '';
    var type = table.geomColumnTypes() && table.geomColumnTypes()[0] || "polygon";
    var categories = metadata || props.categories;
    if (categories) {
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
          css += "\n#" + table_name + "[" + property_name + "=" + value + "] {\n   " + fill + ": " + category + ";\n";

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
