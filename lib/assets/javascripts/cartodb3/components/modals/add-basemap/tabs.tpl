<div class="Filters Filters--navListing js-navigation">
  <div class="u-inner">
    <div class="Filters-inner">
      <span class="Filters-separator"></span>
      <div class="Filters-row Filters-row--centered">
        <ul class="Filters-group js-tabs">
          <% model.get('tabs').each(function(tab) { %>
            <li class="Filters-typeItem">
              <button data-name="<%- tab.get('name') %>" class="Filters-typeLink js-typeItem u-actionTextColor CDB-Text is-semibold u-upperCase CDB-Size-medium <%- model.get('currentTab') === tab.get('name') ? 'is-selected' : '' %>">
                <%- tab.get('label') %>
              </button>
            </li>
          <% }) %>
        </ul>
      </div>
    </div>
  </div>
</div>
<div class="js-tab-content Dialog-body Dialog-body--expanded Dialog-body--create Dialog-body--noPaddingTop Dialog-body--withoutBorder"></div>
