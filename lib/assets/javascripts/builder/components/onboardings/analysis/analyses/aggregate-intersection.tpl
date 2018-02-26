<p class="CDB-Text Onboarding-headerDescription">
  <%- _t('analyses-onboarding.new-column-included') %>
</p>

<ul class="Onboarding-list">
  <% if (aggregate_function === 'count') { %>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">count_vals</div>
  </li>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue">count_vals_density</div>
  </li>
  <% } else {%>
  <li class="Onboarding-listItem">
    <div class="Onboarding-listItemValue"><%- aggregate_function %>_<%- aggregate_column %></div>
  </li>
  <% } %>
</ul>

<p class="CDB-Text Onboarding-description">
  <%- _t('analyses-onboarding.aggregate-intersection.description') %>
</p>
