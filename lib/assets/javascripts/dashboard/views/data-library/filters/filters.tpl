<span class="Filters-separator"></span>

<div class="Filters-row">
  <div class="Filters-group <% if (q) { %>is-searching<% } %>">
    <div class="Filters-typeItem Filters-typeItem--searchEnabler js-search-enabler">
      <a href="#/search" class="Filters-searchLink CDB-Text CDB-Size-medium u-actionTextColor u-flex u-upperCase is-semibold js-search-link">
        <div class="CDB-Shape u-rSpace">
          <div class="CDB-Shape-magnify is-small is-blue"></div>
        </div>
        Search
      </a>
    </div>

    <div class="Filters-typeItem Filters-typeItem--searchField js-search-field">
      <form class="Filters-searchForm js-search-form" action="#">
        <input class="Filters-searchInput CDB-Text CDB-Size-medium js-search-input" type="text" value="<%- q %>" placeholder="by name" />
        <% if (q) { %>
          <div class="CDB-Shape js-clean-search">
            <div class="CDB-Shape-close is-blue is-large"></div>
          </div>
        <% } %>
      </form>
    </div>
  </div>

  <ul class="Filters-group">
    <li class="Filters-typeItem <% if (q) { %>is-searching<% } %>">
      <a class="Filters-typeLink CDB-Text CDB-Size-medium is-semibold u-upperCase js-categoriesDropdown" href="#/category">
        <%- tag == '' ? 'Category' : tag %>
      </a>
    </li>
  </ul>
</div>
