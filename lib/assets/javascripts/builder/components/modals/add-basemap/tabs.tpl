<div class="Modal-navigation">
  <ul class="Modal-navigationInner CDB-Text is-semibold CDB-Size-medium js-tabs">
    <% model.get('tabs').each(function(tab) { %>
      <li class="CDB-NavMenu-item <%- model.get('currentTab') === tab.get('name') ? 'is-selected' : '' %>">
        <button data-name="<%- tab.get('name') %>" class="CDB-NavMenu-link u-upperCase">
          <%- tab.get('label') %>
        </button>
      </li>
    <% }) %>
  </ul>
</div>
<div class="Modal-inner Modal-inner--with-navigation js-tab-content"></div>
