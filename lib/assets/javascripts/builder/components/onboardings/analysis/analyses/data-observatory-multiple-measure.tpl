<p class="CDB-Text Onboarding-headerDescription">
  <%- _t('analyses-onboarding.new-columns-included') %>
</p>

<ul class="Onboarding-list">
  <% _.each(column_names, function (column) { %>
    <li class="Onboarding-listItem">
      <div class="Onboarding-listItemValue"><%- column %></div>
    </li>
  <% }); %>
</ul>

<p class="CDB-Text Onboarding-description"><%- _t('analyses-onboarding.data-observatory-multiple-measures.custom-columns') %>

<p class="CDB-Text Onboarding-description">
  <%- _t('analyses-onboarding.data-observatory-multiple-measures.description') %>
</p>

<p class="CDB-Text Onboarding-description">
  <a href="https://carto.com/learn/guides/analysis/enrich-from-data-observatory" class="Onboarding-readMore" target="_blank"><%- _t('analyses-onboarding.learn-more') %></a>
</p>