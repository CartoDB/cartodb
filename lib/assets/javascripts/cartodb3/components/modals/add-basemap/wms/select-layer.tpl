<div class="u-inner">
  <div class="Filters WMSSSelectLayer-Filter is-relative">
    <div class="Filters-inner">
      <div class="Filters-row">
        <ul class="Filters-group">
          <li class="Filters-typeItem Filters-typeItem--searchEnabler">
            <a href="#/search" class="Filters-searchLink js-search-link">
              <i class="Filters-searchLinkIcon CDB-IconFont CDB-IconFont-lens"></i>Search
            </a>
          </li>
          <li class="Filters-typeItem Filters-typeItem--searchField">
            <form class="Filters-searchForm js-search-form" action="#">
              <input class="Filters-searchInput js-search-input" type="text" value="<%- searchQuery %>" placeholder="<%- layersFound.length %> LAYER(s) found, <%- layersAvailableCount %> LAYER(s) available" />
              <button type="button" class="Filters-cleanSearch js-clean-search">
                <i class="CDB-IconFont CDB-IconFont-close"></i>
              </button>
            </form>
          </li>
        </ul>
        <span class="Filters-separator"></span>
      </div>
    </div>
  </div>
  <ul class="List js-layers"></ul>

  <% if (searchQuery && layersFound.length == 0) { %>
  <div class="IntermediateInfo">
    <div class="LayoutIcon">
      <i class="CDB-IconFont CDB-IconFont-defaultUser"></i>
    </div>
    <h4 class="IntermediateInfo-title">Oh! No results</h4>
    <p class="DefaultParagraph DefaultParagraph--short">
      Unfortunately we couldn't found any layer that matched your search term
    </p>
  </div>
</div>
<% } %>

<button class="NavButton Dialog-backBtn js-back">
  <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
</button>
