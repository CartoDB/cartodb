/**
 * A geocoder allows to transform addresses into earth locations.
 */
function Geocoder () {

}

/**
 *  Transform the postal address into a location on the Earth's surface.
 * @param {string} address - The adress to be transformed
 * @param {function} callback - Callbak executed with the geocoded results.
 */
Geocoder.prototype.geocode = function (address, callback) {
  throw new Error('subclasses of Geocoder must implement geocode');
};
