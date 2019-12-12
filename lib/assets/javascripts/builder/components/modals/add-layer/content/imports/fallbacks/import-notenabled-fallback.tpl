<div class="ImportPanel-header">
  <% if (state === "idle") { %>
    <p class="SelectedImport__desc CDB-Text CDB-Size-medium u-secondaryTextColor">
      <%- _t('components.modals.add-layer.imports.notenabled.fallback-desc', { brand: title }) %>
    </p>
    <button class="CDB-Button CDB-Button--primary CDB-Button--medium js-connectnow">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.contact-us') %></span>
    </button>
  <% } else if (state === "success") { %>
    <div class="SelectedImport__desc CDB-Text CDB-Size-medium u-secondaryTextColor">
     <p><%- _t('components.modals.add-layer.imports.notenabled.request-sent') %></p>
     <p><%- _t('components.modals.add-layer.imports.contact-soon') %></p>
    </div>
    <button class="CDB-Button CDB-Button--primary CDB-Button--medium js-back">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.got-it') %></span>
    </button>
  <% } else if (state === "error") { %>
    <p class="SelectedImport__desc CDB-Text CDB-Size-medium u-secondaryTextColor">
      <%- _t('components.modals.add-layer.imports.notenabled.fallback-error') %>
    </p>
    <button class="CDB-Button CDB-Button--primary CDB-Button--medium js-back">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.try-again') %></span>
    </button>
  <% } else { %>
    <p class="SelectedImport__desc CDB-Text CDB-Size-medium u-secondaryTextColor">
      <%- _t('components.modals.add-layer.imports.loading') %>
    </p>
    <div class="Spinner ImportPanel-actionsLoader"></div>
  <% } %>
</div>
