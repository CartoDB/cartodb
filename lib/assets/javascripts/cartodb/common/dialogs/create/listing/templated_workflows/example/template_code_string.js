
// Example of template code


module.exports = "{"+
" steps: ["+
"   {"+
"     title: 'Choose city',"+
"     forms: [{"+
"       name: 'City Name',"+
"       form: {"+
"         'city_name': {"+
"           type: 'select',"+
"           extra: ['madrid', 'new york', 'ibiza', 'cudillero', 'hinojosa']," + // select city from uber_common_data.cities
"           value: 'madrid',"+
"         }"+
"       }"+
"     }]"+
"   },"+
"   {"+
"     title: 'Select date range',"+
"     forms: [{"+
"       name: 'Date range',"+
"       form: {"+
"         'date_range': { type: 'date_range', min: 'select min(date) as min from uber_common_data.rides' },"+
"       },"+
"       validate: function(attrs) {"+
"         if (attrs.date_start > attrs.date_end) {"+
"           return 'date start should be...'"+
"         }"+
"         return null;"+
"       }"+
"     }]"+
"   }"+
" ],"+
" onStepFinished: function(step, attributes, done) {"+
"   done(null);"+
" },"+
" onWizardFinished: function(visualization, done) {},"+
" getStep: function(i) { return this.steps[i] },"+
" getSteps: function() { return this.steps }"+
"}";