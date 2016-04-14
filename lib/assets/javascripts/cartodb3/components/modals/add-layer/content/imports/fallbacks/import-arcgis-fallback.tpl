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
  <a href="mailto:sales@cartodb.com?subject=I am interested in the ArcGIS connector&body=Hi, I am interested in testing the ArcGIS connector. Please, contact me to schedule a demo of this feature." class="Button Button--invert ImportPanel-headerLink">
    <span><%- _t('components.modals.add-layer.imports.ask-for-demo') %></span>
  </a>
</div>
