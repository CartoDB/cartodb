<div class="SelectedImport__header CDB-Text CDB-Size-large u-mainTextColor">
  <button class="SelectedImport__back CDB-Text is-semibold u-upperCase CDB-Size-medium u-actionTextColor js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev is-semibold u-mr--4"></i>
    <span><%= _t('components.modals.add-layer.imports.go-connectors') %></span>
  </button>
  <div class="u-flex">
    <img class="SelectedImport__icon" src="<%= __ASSETS_PATH__ %>/images/layout/connectors/<%= name %>.svg" alt="<%= _t('components.modals.add-layer.imports.header-alt', { brand: cdb.core.sanitize.html(title)}) %>">
    <span><%= _t('components.modals.add-layer.imports.header', { brand: cdb.core.sanitize.html(title)}) %></span>
    <% if (beta) { %>
      <div class="SelectedImport__tag CDB-Text CDB-Size-small u-upperCase">Beta</div>
    <% } %>
  </div>
</div>
