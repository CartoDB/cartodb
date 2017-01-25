<div class="Filters is-relative">
  <div class="Filters-inner">
    <div class="Filters-row Share-filtersRow js-filters">
      <div class="Filters-typeItem Filters-typeItem--searchEnabler">
        <p class="Filters-searchLink js-search-link u-alignCenter CDB-Text CDB-Size-medium u-upperCase">
          <i class="Filters-searchLinkIcon CDB-IconFont CDB-IconFont-lens u-rSpace--xl"></i> <%- _t('components.pagination-search.filter.search') %>
        </p>
      </div>
      <div class="Filters-typeItem Filters-typeItem--searchField">
        <input class="Filters-searchInput CDB-Text CDB-Size-medium js-search-input" type="text" value="<%- q %>" placeholder="<%- _t('components.pagination-search.filter.placeholder') %>" />
        <% if (q !== '') { %>
        <button type="button" class="CDB-Shape Filters-cleanSearch js-clean-search u-actionTextColor">
          <div class="CDB-Shape-close is-blue is-large"></div>
        </button>
        <% } %>
      </div>
    </div>
  </div>
</div>
<div class="js-content"></div>