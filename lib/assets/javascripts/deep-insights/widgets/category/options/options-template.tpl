<% if (isSearchEnabled) { %>
  <p class="CDB-Text is-semibold CDB-Size-small u-upperCase js-lockCategories"><%- totalLocked %><%= _t('deep_insights.widgets.selected') %></p>
<% } else { %>
  <p class="CDB-Text is-semibold CDB-Size-small u-upperCase js-textInfo">
    <% if (isLocked) { %>
      <%- totalCats %> blocked <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-link u-lSpace js-unlock"><%= _t('deep_insights.widgets.unlock') %></button>
    <% } else { %>
      <% if (noneSelected) { %>
        <%= _t('deep_insights.widgets.no_selected') %>
      <% } else { %>
        <%- allSelected ? "All selected" : acceptedCats + " selected" %>
        <% if (canBeLocked) { %>
          <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-link u-lSpace js-lock"><%= _t('deep_insights.widgets.lock') %></button>
        <% }%>
      <% }%>
    <% } %>
  </p>
  <% if (canSelectAll) { %>
    <div class="CDB-Widget-filterButtons">
      <button class="CDB-Text CDB-Size-small u-upperCase u-actionTextColor CDB-Widget-link CDB-Widget-filterButton js-all"><%= _t('deep_insights.widgets.all') %></button>
    </div>
  <% } %>
<% } %>
