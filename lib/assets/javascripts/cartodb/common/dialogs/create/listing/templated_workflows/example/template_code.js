
// Example of template code


module.exports = {

  steps: [
    {
      title: 'this if the first step, import your table',
      forms: [{
        name: 'City Name',
        form: {
          'city_name': {
            type: 'select',
            extra: 'select city from uber_common_data.cities'
          }
        }
      }]
    },
    {
      title: 'select date range',
      forms: [{
        name: 'date range',
        form: {
          'date_range': { type: 'date_range', min: 'select min(date) as min from uber_common_data.rides' },
        },
        validate: function(attrs) {
          if (attrs.date_start > attrs.date_end) {
            return "date start should be..."
          }
          return null;

        }
      }]
    }
  ],

  // called when the user clicks on next
  onStepFinished: function(step, attributes, done) { 
    // check everything is ok
    done(null);
    // done(new Error("whaever check"))
    // user can't pass to the next step until done callback is called without errors
  },

  // called when the last step is checked by onStepFinished
  onWizardFinished: function(visualization, done) {
    // this.visualization.map.layers.at(1).set('sql', 'select * from uber_common_data.rides where date between {date_start} and {date_end} AND city = {city_name}'.format(this.attributes));
    // this.visualization.overlays.add({
    //   type: 'text'
    //   position: [0, 0],
    //   text: "rides from {date_start} to {date_end}"
    // })

    // it could add more layers
    // layer = this.visualizations.addLayer()
    // layer.set('sql', ...)
    // layer.wizard('chrolopleth', { colorScale: .... })

    // create the new vis
    // this.visualization.save(done);
  },

  // returns the form for step #i
  getStep: function(i) {
    return this.steps[i];
  }
}

/*
try { 
  vis = original_vis.copy();
  tmpl.onWizardFinished(vis)
} catch(e) {
  vis.destroy();
}
*/