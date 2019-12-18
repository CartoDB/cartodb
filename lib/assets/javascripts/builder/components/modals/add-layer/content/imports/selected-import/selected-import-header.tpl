<div class="SelectedImport__header CDB-Text CDB-Size-large u-mainTextColor">
  <button class="SelectedImport__back CDB-Size-large js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev u-actionTextColor"></i>
  </button>
  <div class="u-flex">
    <img class="SelectedImport__icon" src="<%= __ASSETS_PATH__ %>/images/layout/connectors/<%= name %>.svg" alt="<%= _t('components.modals.add-layer.imports.header-alt', { brand: cdb.core.sanitize.html(title)}) %>">
    <span><%= _t('components.modals.add-layer.imports.header', { brand: cdb.core.sanitize.html(title)}) %></span>
    <% if (beta) { %>
      <div class="SelectedImport__tag CDB-Text CDB-Size-small u-upperCase">Beta</div>
    <% } %>
  </div>
</div>
