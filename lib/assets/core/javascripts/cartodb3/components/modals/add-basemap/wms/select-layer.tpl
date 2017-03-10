<div class="u-inner">
  <div class="Filters WMSSSelectLayer-Filter is-relative">
    <div class="Filters-inner">
      <div class="Filters-row">
        <div class="Filters-group">
          <div class="Filters-typeItem Filters-typeItem--searchEnabler">
            <button class="Filters-searchLink CDB-Text is-semibold u-upperCase CDB-Size-medium js-search-link">
              <i class="Filters-searchLinkIcon CDB-IconFont CDB-IconFont-lens"></i><%- _t('components.modals.add-layer.navigation.search') %>
            </button>
          </div>
        </div>

        <div class="Filters-typeItem Filters-typeItem--searchField">
          <form class="Filters-searchForm js-search-form" action="#">
            <input class="Filters-searchInput CDB-Text CDB-Size-medium js-search-input" type="text" value="<%- searchQuery %>" placeholder="<%- _t('components.modals.add-basemap.wms.placeholder', { layersFoundCount: layersFound.length, layersFoundCountPluralize: _t('components.modals.add-basemap.wms.tables-pluralize', { smart_count: layersFound.length }), layersAvailableCount: layersAvailableCount, layersAvailableCountPluralize: _t('components.modals.add-basemap.wms.tables-pluralize', { smart_count: layersAvailableCount }) }) %>" />
            <button type="button" class="Filters-cleanSearch js-clean-search u-actionTextColor">
              <i class="CDB-IconFont CDB-IconFont-close"></i>
            </button>
          </form>
        </div>

        <span class="Filters-separator"></span>
      </div>
    </div>
  </div>

  <% if (searchQuery && layersFound.length == 0) { %>
    <div class="IntermediateInfo">
      <div class="LayoutIcon">
        <i class="CDB-IconFont CDB-IconFont-defaultUser"></i>
      </div>
      <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace u-secondaryTextColor u-tSpace-xl"><%- _t('components.modals.add-basemap.wms.oh-no') %></h4>
      <p class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-basemap.wms.unfortunately') %></p>
    </div>
  <% } else { %>
    <div class="js-layers"></div>
  <% } %>
</div>

<button class="NavButton Dialog-backBtn js-back">
  <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
</button>
