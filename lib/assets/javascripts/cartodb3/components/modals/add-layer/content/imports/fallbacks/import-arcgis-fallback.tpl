<div class="ImportPanel-header">
  <div class="LayoutIcon ImportPanel-headerIcon">
    <i class="CDB-IconFont CDB-IconFont-gift"></i>
  </div>
  <h3 class="ImportPanel-headerTitle">ArcGIS<sup>&trade;</sup> <%- _t('components.modals.add-layer.imports.connector') %></h3>
  <p class="ImportPanel-headerDescription">
    <%= _t('components.modals.add-layer.imports.arcgis.fallback-desc', {
      brand: 'ArcGIS<sup>&trade;</sup>'
    }) %>
  </p>
  <a href="mailto:sales@cartodb.com?subject=<%- _t('components.modals.add-layer.imports.demo-email-title', { name: 'ArcGIS' }) %>&body=<%- _t('components.modals.add-layer.imports.demo-email-desc', { name: 'ArcGIS' }) %>" class="Button Button--invert ImportPanel-headerLink">
    <span><%- _t('components.modals.add-layer.imports.ask-for-demo') %></span>
  </a>
</div>
