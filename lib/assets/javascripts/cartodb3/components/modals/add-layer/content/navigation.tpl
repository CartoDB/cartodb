<span class="Filters-separator"></span>

<div class="Filters-row">
  <div class="Filters-group">
    <div class="Filters-typeItem Filters-typeItem--searchEnabler js-search-enabler">
      <button class="Filters-searchLink js-search-link">
        <i class="Filters-searchLinkIcon CDB-IconFont CDB-IconFont-lens"></i><%- _t('components.modals.add-layer.navigation.search') %>
      </button>
    </div>

    <ul class="Filters-group js-links-list">
      <li class="Filters-typeItem js-filter-type">
        <button class="Filters-typeLink js-connect <%- listingType === 'import' ? 'is-selected' : '' %> <%- !canCreateDataset ? 'is-disabled' : '' %>">
          <%- _t('components.modals.add-layer.navigation.connect-dataset') %>
        </button>
      </li>
      <% if (showDatasets) { %>
        <li class="Filters-typeItem js-filter-type">
          <button class="Filters-typeLink js-datasets <%- listingType === 'datasets' && shared !== 'only' && !library ? 'is-selected' : '' %>">
            <% if (totalItems) { %>
              <strong><%- totalItems %></strong>
            <% } %>
            <%- _t('components.modals.add-layer.navigation.dataset-pluralize', { smart_count: totalItems }) %>
          </button>
        </li>
        <% if (isInsideOrg) { %>
          <li class="Filters-typeItem js-filter-type">
            <button class="Filters-typeLink js-shared <%- listingType === 'datasets' && shared === "only" ? 'is-selected' : '' %>">
              <% if (totalShared) { %>
                <strong><%- totalShared %></strong>
              <% } %>
              <%- _t('components.modals.add-layer.navigation.shared-with-you') %>
            </button>
          </li>
        <% } %>
      <% } %>
      <li class="Filters-typeItem js-filter-type">
        <button class="Filters-typeLink js-library <%- listingType === 'datasets' && library ? 'is-selected' : '' %>">
          <%- _t('components.modals.add-layer.navigation.data-library') %>
        </button>
      </li>
    </ul>
  </div>

  <div class="Filters-typeItem Filters-typeItem--searchField js-search-field">
    <form class="Filters-searchForm js-search-form">
      <input class="Filters-searchInput js-search-input" type="text" value="<%- ( tag && (':' + tag) ) || q %>" placeholder="<%- _t('components.modals.add-layer.navigation.search-placeholder') %>" />
      <% if (tag || q) { %>
        <button type="button" class="Filters-cleanSearch js-clean-search">
          <i class="CDB-IconFont CDB-IconFont-close"></i>
        </button>
      <% } %>
    </form>
  </div>

  <div class="Filters-group js-order-list">
    <ul class="Filters-group">
      <li class="Filters-typeItem">
        <button class="Filters-typeLink js-create-empty <%- listingType === 'scratch' ? 'is-selected' : '' %> <%- !canCreateDataset ? 'is-disabled' : '' %>">
          <%- _t('components.modals.add-layer.navigation.create-empty-' + createModelType) %>
        </button>
      </li>
    </ul>
  </div>
</div>
