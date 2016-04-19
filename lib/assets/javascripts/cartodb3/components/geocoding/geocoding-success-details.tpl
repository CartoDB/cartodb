<div class="Dialog-header u-inner">
  <div class="LayutIcon LayoutIcon--positive Dialog-headerIcon">
    <i class="CDB-IconFont CDB-IconFont-<%- geometryType && geometryType === 'point' ? 'streets' : 'globe' %>"></i>
    <span class="Badge Badge--positive Dialog-headerIconBadge">
      <i class="CDB-IconFont CDB-IconFont-check"></i>
    </span>
  </div>
  <h3 class="Dialog-headerTitle"><%- _t('components.geocoding-success-detail.success-title') %></h3>
  <p class="Dialog-headerText Dialog-headerText--centered Dialog-narrowerContent">
    <%- _t('components.geocoding-success-detail.success-description', { smart_count: processableRows }) %>
  </p>
</div>

<% if (processableRows > realRows) { %>
  <div class="Dialog-body Dialog-resultsBody">
    <span class="Dialog-resultsBodyIcon NavButton ">?</span>
    <div class="Dialog-resultsBodyTexts">
      <p class="DefaultParagraph">
        <%- _t('components.geocoding-success-detail.explanation') %>
        <% if (!googleUser) { %>
        <%- _t('components.geocoding-success-detail.try-again') %>
        <% }%>
      </p>
    </div>
  </div>
<% } %>

<% if (!googleUser && hasPrice) { %>
  <div class="Dialog-body Dialog-resultsBody">
    <div class="Dialog-resultsBodyIcon LayoutIcon <%- price > 0 ? 'LayoutIcon--warning' :  'LayoutIcon--positive' %>">
      <span class="CDB-IconFont CDB-IconFont-dollar CDB-IconFont--super"></span>
    </div>
    <div class="Dialog-resultsBodyTexts">
      <% if (price > 0) { %>
        <p class="DefaultTitle">
          <%- _t('components.geocoding-success-detail.amount-charged', { price: price / 100 }) %>
        </p>
        <p class="DefaultParagraph DefaultParagraph--tertiary">
          <%- _t('components.geocoding-success-detail.success-title', { price: blockPrice / 100 }) %>
        </p>
      <% } else { %>
        <p class="DefaultTitle">
          <%- _t('components.geocoding-success-detail.no-extra-charge') %>
        </p>
        <p class="DefaultParagraph DefaultParagraph--tertiary">
          <%- _t('components.geocoding-success-detail.remaining-quota', { remainingQuotaFormatted: remainingQuotaFormatted }) %>
        </p>
      <% } %>
    </div>
  </div>
<% } %>

<div class="Dialog-footer Dialog-footer--simple u-inner Dialog-narrowerContent">
  <button class="cancel Button Button--secondary <%- showGeocodingDatasetURLButton ? 'Dialog-footerBtn' : '' %>">
    <span>close</span>
  </button>
  <% if (showGeocodingDatasetURLButton) { %>
    <a href="<%- datasetURL %>" class="Button Button--main">
      <span><%- _t('components.geocoding-success-detail.view-dataset') %></span>
    </a>
  <% } %>
</div>
