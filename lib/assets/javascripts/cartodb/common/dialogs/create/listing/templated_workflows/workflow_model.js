var cdb = require('cartodb.js');
var WorkflowStepFormCollection = require('./workflow_step_form_collection');
var ImportsModel = require('../../../../background_polling/models/imports_model');

/**
 *  Model that contains all the info when a
 *  visualization template has been selected
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    state: 'idle',
    stepNumber: null,
    stepFormCollection: null,
    formAttributes: {},
    template: null
  },

  initialize: function() {
    this._newDatasets = [];
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:template', function() {
      this.attributes.formAttributes = {};
      this._newDatasets = [];
      this.set({
        state: 'idle',
        stepNumber: 0
      });

    }, this);
    this.bind('change:stepNumber', function() {
      var stepNumber = this.get('stepNumber');
      var step = this.getStep(stepNumber);
      if (step !== null) {
        var stepFormCollection = new WorkflowStepFormCollection(null, step);
        this.set('stepFormCollection', stepFormCollection);  
      }
    }, this);
  },

  resetValues: function() {
    _.extend(this.attributes, this.defaults);
    this.trigger('change:stepNumber');
  },

  isStepValid: function() {
    var stepFormCollection = this.get('stepFormCollection');
    return stepFormCollection && stepFormCollection.isValid();
  },

  isFinalStep: function() {
    var stepNumber = this.getStepNumber();
    var stepsCount = this.getStepNames().length;
    return (stepsCount - 1) === stepNumber;
  },

  isFirstStep: function() {
    var stepNumber = this.getStepNumber();
    return stepNumber === 0
  },

  nextStep: function() {
    var self = this;

    if (this.isStepValid()) {
      // Save attributes from current step
      var formAttrs = this.get('formAttributes');
      var stepAttrs = this.get('stepFormCollection').toJSON();
      this.set('formAttributes', _.extend(formAttrs, stepAttrs));

      // onStepFinished?
      var template = this.get('template');
      var stepNumber = this.get('stepNumber');
      template.onStepFinished(stepNumber, stepAttrs, function() {
        // Change step number
        if (!self.isFinalStep()) {
          self.set('stepNumber', stepNumber + 1);
        } else {
          self._createDatasets();
        }
      });
    }
  },

  isCreating: function() {
    return this.get('state') === "creating"
  },

  isImporting: function() {
    return this.get('state') === "importing"
  },

  isIdle: function() {
    return !this.isCreating() && !this.isErrored()
  },

  isErrored: function() {
    return this.get('state') === "error"
  },

  _createDatasets: function(i) {
    var self = this;
    var template = this.get('template');
    var attrs = this.get('formAttributes');
    var imports = template && template.imports && template.imports(attrs);

    if (i === undefined) {
      i = 0;
    }

    if (imports && imports[i]) {

      var importData = imports[i];

      var d = _.extend(
        importData,
        { create_vis: false }
      );

      var impModel = this._currentImport = new ImportsModel({}, {
        upload: d,
        user: this.user
      });

      this.set('state', 'importing');

      impModel.bind('change:state', function(m) {
        if (m.hasCompleted()) {
          this._newDatasets.push(m);
          self._createDatasets(++i);
        }
        if (m.hasFailed()) {
          this.set('state', 'error');
        }
      }, this);

      // If import model has any errors at the beginning
      if (impModel.hasFailed()) {
        this.set('state', 'error');
      }

    } else {
      delete this._currentImport;
      this._createMap();
    }
  },

  _createMap: function() {
    var self = this;
    var template = this.get('template');
    var formAttributes = this.get('formAttributes');
    var imports = this._newDatasets;

    var vis = new cdb.admin.Visualization({
      id: template.get('source_visualization')['id']
    });

    // Creating state
    this.set('state', 'creating');

    // Duplicate map
    this._newVis = vis.copy({
      name: template.get('name'),
      description: template.get('description')
    }, {
      success: function(mdl, obj) {
        template.onWizardFinished(mdl, formAttributes, imports, function() {
          window.location.href = self._newVis.viewUrl() + "/map";
        })
      },
      error: function(err) {
        self.set('state', 'error');
      }
    });
  },

  previousStep: function() {
    if (!this.isFirstStep()) {
      var stepNumber = this.getStepNumber();
      this.set('stepNumber', stepNumber - 1);
    }
  },

  getStepNumber: function() {
    return this.get('stepNumber');
  },

  getStep: function(i) {
    var template = this.get('template');
    return template && template.getStep && template.getStep(i);
  },

  getCurrentImport: function() {
    return this._currentImport;
  },

  getPendingImports: function() {
    var template = this.get('template');
    var attrs = this.get('formAttributes');
    var imports = template && template.imports && template.imports(attrs);
    var importedDatasets = this.getImportedDatasets().length;
    return imports && imports.slice(importedDatasets - 1, template.imports.length - 1) || [];
  },

  getImportedDatasets: function() {
    return this._newDatasets;
  },

  getStepNames: function() {
    var template = this.get('template');
    return template && template.getStepNames();
  },

  getStepFormCollection: function() {
    return this.get('stepFormCollection');
  },

  getTemplateName: function() {
    var template = this.get('template');
    return template && template.get('name')
  }

});