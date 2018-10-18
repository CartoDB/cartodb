<div class="Filters is-relative <% if (thinFilters) { %>Filters--thin<% } %>">
  <div class="Filters-inner">
    <div class="Filters-row js-filters">
      <div class="Filters-typeItem Filters-typeItem--searchEnabler">
        <p class="Filters-searchLink js-search-link u-alignCenter CDB-Text CDB-Size-medium">
          <i class="Filters-searchLinkIcon CDB-IconFont CDB-IconFont-lens"></i> Search
        </p>
      </div>
      <div class="Filters-typeItem Filters-typeItem--searchField">
        <form class="Filters-searchForm js-search-form" action="#">
          <input class="Filters-searchInput CDB-Text CDB-Size-medium js-search-input" type="text" value="<%- q %>" placeholder="Search by username or email" />
          <button type="button" class="Filters-cleanSearch js-clean-search u-actionTextColor">
            <i class="CDB-IconFont CDB-IconFont-close"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
  <span class="Filters-separator"></span>
</div>
<div class="js-tab-pane"></div>
