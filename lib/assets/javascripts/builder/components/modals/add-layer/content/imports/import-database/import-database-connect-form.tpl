<form class="Form js-form">
  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-server') %></label>
    </div>
    <div class="Form-rowData">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-server" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-server', { brand: title}) %>" />
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-port') %></label>
    </div>
    <div class="Form-rowData">
      <input type="number" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-port" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-port') %>" />
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-database') %></label>
    </div>
    <div class="Form-rowData">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-database" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-database') %>" />
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-username') %></label>
    </div>
    <div class="Form-rowData">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-username" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-username') %>" />
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-password') %></label>
    </div>
    <div class="Form-rowData">
      <input type="password" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-password" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-password') %>" />
    </div>
  </div>

  <div class="Form-row">
    <div class="Form-rowLabel Form-rowLabel--small"></div>
    <div class="Form-rowData u-flex__justify--end">
      <button type="submit" class="CDB-Button CDB-Button--primary is-disabled js-submit">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.database.connect-button') %></span>
      </button>
    </div>
  </div>
</form>
