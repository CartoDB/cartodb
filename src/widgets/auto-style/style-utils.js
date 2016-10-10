function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function removeEmptyLayer (cartocss) {
  return cartocss.replace(/[^;}{]*{((\s|\n)*?)}/g, '');
}

function setFlagInCartocss (cartocss, attr, flag) {
  return cartocss.replace(getAttrRegex(attr, false), flag);
}

function removeAttr (cartocss, attr) {
  return cartocss.replace(getAttrRegex(attr, true), '');
}

function insertCartoCSSAttribute (cartocss, attrib, flag) {
  return cartocss.replace(flag, attrib);
}

function changeStyle (cartocss, attr, newStyle) {
  var flag = '##' + attr + '##;';

  return insertCartoCSSAttribute(
            removeEmptyLayer(
              removeAttr(
                setFlagInCartocss(cartocss, attr, flag),
                attr
              )
            ),

            newStyle,
            flag
          );
}

module.exports = {

  getAttrRegex: getAttrRegex,

  removeEmptyLayer: removeEmptyLayer,

  setFlagInCartocss: setFlagInCartocss,

  removeAttr: removeAttr,

  insertCartoCSSAttribute: insertCartoCSSAttribute,

  changeStyle: changeStyle

};
