
/**
 *  Map templates
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */

module.exports = [{
  name: 'Geolocalize your customers with one click',
  short_name: 'Geolocalize your customers',
  description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit',
  short_description: 'Lorem ipsum dolor sit amet',
  icon: '',
  color: '#EEE',
  video: {
    id: '108146837',
    steps: [
      {
        seconds: 5,
        msg: 'createVis'
      },
      {
        seconds: 100,
        msg: 'Test 2'
      },
      {
        seconds: 200,
        msg: 'Test 3'
      },
      {
        seconds: 340,
        msg: 'Test 4'
      }
    ]
  },
  map: {
    url: 'http://cartodb.com/solutions/mailchimp'
  }
}]