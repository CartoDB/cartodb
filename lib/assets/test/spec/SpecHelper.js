

var TestUtil = {};

TestUtil.createTable = function(name) {
  return new cdb.admin.CartoDBTableMetadata({ name: name });
};
