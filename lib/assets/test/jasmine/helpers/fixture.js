module.exports = {
  addToFixture: function (str) {
    function parseHTML(str) {
      var tmp = document.implementation.createHTMLDocument();
      tmp.body.innerHTML = str;
      return tmp.body.children[0];
    }
    document.getElementById('jasmine-fixture').appendChild(parseHTML(str));
  },

  createFixture: function () {
    var fixture = document.createElement('div');
    fixture.id = 'jasmine-fixture';
    document.getElementsByTagName('body')[0].appendChild(fixture);
  },

  removeFixture: function () {
    var fixture = document.getElementById('jasmine-fixture');
    fixture.parentNode.removeChild(fixture);
  }
};