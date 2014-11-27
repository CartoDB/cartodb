var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodbui');

var currentCellEditorDialog;

// TODO: extracted from table/tableview.js and adapted to not be too tied to parent backbone view, most of it should
// really be in the cdb.admin.SmallEditorDialog since it's sole purpose is to handle the cell editing.
var getEditor = function(columnType) {
  var editors = {
    'string':                       cdb.admin.StringField,
    'number':                       cdb.admin.NumberField,
    'date':                         cdb.admin.DateField,
    'geometry':                     cdb.admin.GeometryField,
    'timestamp with time zone':     cdb.admin.DateField,
    'timestamp without time zone':  cdb.admin.DateField,
    'boolean':                      cdb.admin.BooleanField
  };

  var editorExists = _.filter(editors, function(a,i) { return i === columnType }).length > 0;

  if(columnType !== "undefined" && editorExists) {
    return editors[columnType];
  } else {
    return editors['string']
  }
};

module.exports = function(args) {
  if (currentCellEditorDialog) {
    currentCellEditorDialog.hide();
    currentCellEditorDialog.clean();
  }

  var columnName = args.columnName;
  var columnType = args.columnType === 'the_geom' ? 'geometry' : args.columnType;
  var row = args.row;
  var isTableReadOnly = args.isTableReadOnly;
  var e = args.ev;

  var initialValue = row.get(columnName);
  if (initialValue === 0) {
    initialValue = '0'
  } else if (initialValue === undefined) {
    initialValue = '';
  }

  var prevRow = _.clone(row.toJSON());

  currentCellEditorDialog = new cdb.admin.SmallEditorDialog({
    value:        initialValue,
    column:       columnName,
    row:          row,
    readOnly:     isTableReadOnly,
    editorField:  getEditor(columnType),
    res: function(newValue) {
      if(!_.isEqual(newValue, prevRow[columnName])) {
        // do not use save error callback since it avoid model error method to be called
        row.bind('error', function editError() {
          row.unbind('error', editError);
          // restore previous on error
          row.set(columnName, prevRow[columnName]);
        });
        row.save(columnName, newValue);
      }
    }
  });

  if(!currentCellEditorDialog) {
    cdb.log.error("editor not defined for column type " + columnType);
    return;
  }

  // auto add to table view
  // Check first if the row is the first or the cell is the last :)
  var $td = $(e.target).closest("td")
    , offset = $td.offset()
    , $tr = $(e.target).closest("tr")
    , width = Math.min($td.outerWidth(), 278);

  // Remove header spacing from top offset
  offset.top = offset.top - $('table').offset().top;

  if ($td.parent().index() == 0) {
    offset.top += 5;
  } else {
    offset.top -= 11;
  }

  if ($td.index() == ($tr.find("td").size() - 1) && $tr.find("td").size() < 2) {
    offset.left -= width/2;
  } else {
    offset.left -= 11;
  }

  currentCellEditorDialog.showAt(offset.left, offset.top, width, true);
};
