<div class="ImportPanel-header">
  <div class="LayoutIcon u-bSpace--xl">
    <i class="CDB-IconFont CDB-IconFont-gift"></i>
  </div>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">ArcGIS<sup>&trade;</sup> <%- _t('components.modals.add-layer.imports.connector') %></h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor u-bSpace--xl">
    <%= _t('components.modals.add-layer.imports.arcgis.fallback-desc', {
      brand: 'ArcGIS<sup>&trade;</sup>'
    }) %>
  </p>
  <a href="mailto:sales@carto.com?subject=<%- _t('components.modals.add-layer.imports.demo-email-title', { name: 'ArcGIS' }) %>&body=<%- _t('components.modals.add-layer.imports.demo-email-desc', { name: 'ArcGIS' }) %>" class="CDB-Button CDB-Button--primary CDB-Button--medium">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-layer.imports.ask-for-demo') %></span>
  </a>
</div>
