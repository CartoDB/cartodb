<div class="Dialog-header ErrorDetails-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--alert">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle--warning">
    <%- _t('components.background-importer.partial-import-details.unable-to-import-as-layers') %>
  </p>
  <p class="Dialog-headerText">
    <%- _t('components.background-importer.partial-import-details.find-connected-datasets') %></br>
    <%- _t('components.background-importer.partial-import-details.upgrade-your-account', { userMaxLayers: userMaxLayers }) %></br>
  </p>
</div>
<% if (maxTablesPerImport) { %>
  <div class="Dialog-body ErrorDetails-body">
    <ul class="ErrorDetails-list">
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep">!</div>
        <div class="ErrorDetails-itemText">
          <%- _t('components.background-importer.partial-import-details.too-many-datasets', { maxTablesPerImport: maxTablesPerImport }) %></br>
        </div>
      </li>
    </ul>
  </div>
<% } %>
<div class="Dialog-footer ErrorDetails-footer">
  <button class="Button Button--secondary ErrorDetails-footerButton js-close">
    <span><%- _t('components.background-importer.partial-import-details.continue-btn') %></span>
  </button>
</div>
