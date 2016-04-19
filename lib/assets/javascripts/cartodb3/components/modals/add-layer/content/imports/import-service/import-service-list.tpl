<div class="ServiceList-header">
  <p class="ServiceList-headerTitle">
    <%- _t('components.modals.add-layer.imports.service-import.found-in', {
      size: size,
      pluralize: pluralize,
      title: title
    }) %>
  </p>
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
