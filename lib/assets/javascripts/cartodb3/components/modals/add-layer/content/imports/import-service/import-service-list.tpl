<div class="ConnectDataset-header">
  <h2 class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('components.modals.add-layer.imports.service-import.found-in', {
      size: size,
      pluralize: pluralize,
      title: title
    }) %>
  </h2>
</div>
<div class="ServiceList-body">
  <% if (size > 0) { %>
    <ul class="ServiceList-items"></ul>
  <% } else { %>
    <div class="IntermediateInfo ServiceList-empty">
      <div class="LayoutIcon">
        <i class="CDB-IconFont CDB-IconFont-lens"></i>
      </div>
      <h4 class="IntermediateInfo-title">
        <%- _t('components.modals.add-layer.imports.service-import.no-results-title') %>
      </h4>
      <p class="DefaultParagraph">
        <%- _t('components.modals.add-layer.imports.service-import.no-results-desc') %>
      </p>
    </div>
  <% } %>
</div>
