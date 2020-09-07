<div class="u-flex u-mt--8">
  <div class="u-flex__grow--1">
    <div class="u-pt--28 u-pb--28">
      <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-mainTextColor u-bSpace--m"><%- _t('components.modals.add-layer.imports.database.title',  { brand: title }) %></h3>
      <p class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-layer.imports.database.desc',  { brand: title }) %></p>
    </div>
    <form class="Form js-form">

      <% _.each(params, function(param){ %>
        <div class="Form-row">
          <div class="Form-rowLabel Form-rowLabel--small">
            <label for="<%- param.key + '-textbox' %>" class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.database.label-' + param.key) %></label>
          </div>
          <div class="Form-rowData">
            <input id="<%- param.key + '-textbox' %>" type="<%- param.type %>" class="CDB-Text CDB-Size-medium Form-input Form-input--long js-textInput js-<%- param.key %>" value="" placeholder="<%= _t('components.modals.add-layer.imports.database.placeholder-' + param.key, { brand: title }) %> <%- param.optional && '(optional)' %>" />
          </div>
        </div>
      <% }); %>

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
