function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function removeEmptyLayer (cartocss) {
  return cartocss.replace(/[^;}{]*{((\s|\n)*?)}/g, '');
}

function setFlagInCartocss (cartocss, attr, flag) {
  var exist = cartocss.search(getAttrRegex(attr, false)) >= 0;

  return exist ? cartocss.replace('{', '{ ' + flag) : cartocss;
}

function removeAttr (cartocss, attr) {
  return cartocss.replace(getAttrRegex(attr, true), '');
}

function insertCartoCSSAttribute (cartocss, attrib, flag) {
  return cartocss.replace(flag, attrib);
}

function replaceWrongSpaceChar (cartocss) {
  return cartocss.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}
/**
 * Change attr style and remove all the duplicates
 * @param  {String} cartocss cartocss original String
 * @param  {String} attr     CSS Attribute ex, polygon-fill
 * @param  {String} newStyle New attribute style ex, polygon-fill: red;
 * @return {String}          Cartocss modified String
 */
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
  changeStyle: changeStyle,
  replaceWrongSpaceChar: replaceWrongSpaceChar
};
