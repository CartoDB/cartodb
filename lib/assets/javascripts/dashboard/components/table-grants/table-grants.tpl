<div class="CDB-Text Editor-formInner">
  <label class="CDB-Legend u-upperCase CDB-Text is-semibold CDB-Size-small"><%= _t('dashboard.components.table_grants.table_grants.datasets') %></label>

  <div class="CDB-Box-modal ApiKeysForm-box-modal">
    <% if (showSearch) { %>
      <div class="CDB-Box-modalHeader">
        <div class="CDB-Box-modalHeaderItem">
          <input type="text" name="text" placeholder="<%= _t('dashboard.components.table_grants.table_grants.placeholder') %>" class="CDB-InputTextPlain CDB-Text js-search">
        </div>
      </div>
    <% } %>

    <ul class="js-datasets-list"></ul>
  </div>
</div>
