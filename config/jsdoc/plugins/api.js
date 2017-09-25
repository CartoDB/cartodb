/**
 * Define @api tag
 */
exports.defineTags = function (dictionary) {
  dictionary.defineTag('api', {
    mustHaveValue: false,
    canHaveType: false,
    canHaveName: false,
    onTagged: function (doclet, tag) {
      doclet.public = true;
    }
  });
};

/*
 * Only items with @api annotation should be documented
 */

exports.handlers = {
  parseComplete: function (e) {
    var doclets = e.doclets;
    for (var i = 0; i < doclets.length; i++) {
      doclets[i].undocumented = !doclets[i].public;
    }
  }
};
