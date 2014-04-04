//i18n
//
function _t(s) {
  return s;
}

var i18n = {
  // format('hello, {0}', 'rambo') -> "hello, rambo"
  format: function (str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }
};


cdb.admin = {};
cdb.admin.dashboard = {};
cdb.forms = {};
cdb.open = {};

