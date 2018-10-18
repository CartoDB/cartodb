<div class="Filters is-relative">
  <span class="Filters-separator"></span>
  <div class="Filters-inner">
    <div class="Filters-row">
      <ul class="Filters-group CDB-Text CDB-Size-medium">
        <li class="u-flex u-alignCenter">
          <a href="<%- backUrl %>" class="u-actionTextColor u-flex u-alignCenter">
            <i class="CDB-IconFont CDB-IconFont-arrowPrev u-rSpace--xl"></i>
          </a>
        </li>
        <li class="Filters-typeItem">
          <div class="FormAccount-title">
            <p class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor"><%- title %></p>
          </div>
        </li>
      </ul>
      <ul class="Filters-group CDB-Text CDB-Size-medium">
        <% if (usersUrl) { %>
          <li class="Filters-typeItem">
            <a href="<%- usersUrl %>" class="CDB-Text CDB-Size-medium u-mainTextColor Filters-typeLink <%- usersUrl.isCurrent ? 'is-selected' : '' %>">
              <%- usersLabel %>
            </a>
          </li>
        <% } %>
        <li class="Filters-typeItem">
          <a href="<%- editUrl %>" class="CDB-Text CDB-Size-medium u-mainTextColor Filters-typeLink <%- editUrl.isCurrent ? 'is-selected' : '' %>">
            Settings
          </a>
        </li>
      </ul>
    </div>
  </div>
</div>
