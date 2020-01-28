<div class="u-flex u-mt--8">
  <div class="u-flex__grow--1">
    <div class="u-pt--28 u-pb--28">
      <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-mainTextColor u-bSpace--m"><%- _t('components.modals.add-layer.imports.database.title',  { brand: title }) %></h3>
      <p class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-layer.imports.database.desc',  { brand: title }) %></p>
    </div>
    <form class="Form js-form">
      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small">
          <label for="server-textbox" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-server') %></label>
        </div>
        <div class="Form-rowData">
          <input id="server-textbox" type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-server" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-server', { brand: title}) %>" />
        </div>
      </div>

      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small">
          <label for="number-textbox" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-port') %></label>
        </div>
        <div class="Form-rowData">
          <input id="number-textbox" type="number" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-port" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-port') %>" />
        </div>
      </div>

      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small">
          <label for="database-textbox" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-database') %></label>
        </div>
        <div class="Form-rowData">
          <input id="database-textbox" type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-database" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-database') %>" />
        </div>
      </div>

      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small">
          <label for="username-textbox" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-username') %></label>
        </div>
        <div class="Form-rowData">
          <input id="username-textbox" type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-username" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-username') %>" />
        </div>
      </div>

      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small">
          <label for="password-textbox" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-password') %></label>
        </div>
        <div class="Form-rowData">
          <input id="password-textbox" type="password" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-password" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-password') %>" autocomplete="off" />
        </div>
      </div>

      <% if (errorMessage) { %>
        <div class="Form-row">
          <div class="ImportOptions__form-error CDB-Text">
            <%- errorMessage %>
          </div>
        </div>
      <% } %>

      <div class="Form-row">
        <div class="Form-rowLabel Form-rowLabel--small"></div>
        <div class="Form-rowData u-flex__justify--end">
          <button type="submit" class="CDB-Button CDB-Button--primary is-disabled js-submit" disabled>
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.database.connect-button') %></span>
          </button>
        </div>
      </div>
    </form>
  </div>
  <div class="ImportPanel-sidebar">
</div>
