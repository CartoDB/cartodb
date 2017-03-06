<p class="CDB-Text Onboarding-headerDescription">
  <%- _t('analyses-onboarding.new-columns-created') %>
</p>

<ul class="Onboarding-list">
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">the_geom</div>
    <p class="CDB-Text Onboarding-description"><%- _t('analyses-onboarding.centroid.the-geom') %></p>
  </li>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">value</div>
    <p class="CDB-Text Onboarding-description">
      <% if (aggregation) { %>
      <%- _t('analyses-onboarding.centroid.aggregated-value') %>
      <% } else { %>
      <%- _t('analyses-onboarding.centroid.non-aggregated-value') %>
      <% } %>
    </p>
  </li>
  <% if (category_column) { %>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">category</div>
    <p class="CDB-Text Onboarding-description"><%- _t('analyses-onboarding.centroid.category') %></p>
  </li>
  <% } %>
</ul>

<p class="CDB-Text Onboarding-description">
  <%- _t('analyses-onboarding.centroid.description') %>
</p>