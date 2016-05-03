<div class="Dialog-header u-inner">
  <div class="LayutIcon LayoutIcon--negative Dialog-headerIcon">
    <i class="CDB-IconFont CDB-IconFont-<%- geometryType && geometryType === "point" ? 'streets' : 'globe' %>"></i>
    <span class="Badge Badge--negative">!</span>
  </div>
  <p class="Dialog-headerTitle"><%- _t('components.geocoding.geocoding-error-details.title') %></p>
  <p class="Dialog-headerText Dialog-headerText--centered Dialog-narrowerContent">
    <%- errorDescription || _t('components.geocoding.geocoding-error-details.description') %>.
    <% if (!customHosted && id) { %>
    <%- _t('components.geocoding.geocoding-error-details.try-again', { id: id }) %>
       <br/><strong><%- id %></strong>.
    <% } %>
  </p>
</div>
<div class="Dialog-footer Dialog-footer--simple u-inner Dialog-narrowerContent">
  <button class="cancel Button Button--secondary <%- showGeocodingDatasetURLButton ? 'Dialog-footerBtn' : '' %>">
    <span><%- _t('components.geocoding.geocoding-error-details.close') %></span>
  </button>
  <% if (showGeocodingDatasetURLButton) { %>
    <a href="<%- datasetURL %>" class="Button Button--main">
      <span><%- _t('components.geocoding.geocoding-error-details.view-dataset') %></span>
    </a>
  <% } %>
</div>
