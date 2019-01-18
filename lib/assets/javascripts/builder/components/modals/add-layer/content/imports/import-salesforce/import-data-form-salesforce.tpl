<form class="Form js-form">
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="CDB-Text CDB-Size-medium"><span><%- _t('components.modals.add-layer.imports.form-import.title') %></span></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--longer has-submit js-textInput" value="" placeholder="<%- _t('components.modals.add-layer.imports.salesforce.salesforce.input-placeholder', { brand: 'Salesforce' }) %>" />
      <button type="submit" class="CDB-Text CDB-Size-small Form-inputSubmit u-upperCase u-actionTextColor Form-inputSubmit">
        <span><%- _t('components.modals.add-layer.imports.form-import.submit') %></span>
      </button>
      <div class="Form-inputError CDB-Text">
        <span><%- _t('components.modals.add-layer.imports.form-import.error-desc') %></span>
      </div>
    </div>
  </div>
</form>
