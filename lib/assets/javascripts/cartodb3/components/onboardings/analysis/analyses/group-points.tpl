<p class="CDB-Text Onboarding-headerDescription">
  <%- _t('analyses-onboarding.geometries-updated') %>
</p>

<ul class="Onboarding-list">
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">the_geom</div>
    <p class="CDB-Text Onboarding-description"><%- _t('analyses-onboarding.group-points.the-geom') %></p>
  </li>
  <% if (category_column) { %>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue"><%- category_column %></div>
    <p class="CDB-Text Onboarding-description"><%- _t('analyses-onboarding.group-points.category') %></p>
  </li>
  <% } %>
</ul>

<p class="CDB-Text Onboarding-description">
  <%- _t('analyses-onboarding.group-points.description', { method: _t('analyses.' + type + '.title') }) %>
</p>

<p class="CDB-Text Onboarding-description">
  <a href="http://postgis.net/docs/manual-2.2/" class="Onboarding-readMore" target="_blank"><%- _t('analyses-onboarding.read-more') %></a>
</p>
