<div class="DatasetSelected-item">
  <div class="DatasetSelected-itemExt CDB-Text u-ellipsis">
    <%- ext || '?' %>
  </div>
  <div class="DatasetSelected-itemInfo u-ellipsis">
    <h6 class="CDB-Text CDB-Size-large u-ellipsis" title="<%- title %>"><%- title %></h6>
    <p class="CDB-Text CDB-Size-small u-ellipsis u-altTextColor"><%- description %></p>
  </div>
</div>
<% if (importCanSync) { %>
  <div class="DatasetSelected-sync">
    <div class="DatasetSelected-syncOptions">
      <label class="DatasetSelected-syncLabel CDB-Text CDB-Size-medium u-mainTextColor">
        <%- _t('components.modals.add-layer.imports.selected-state.sync-my-data') %>
      </label>
      <ul class="DatasetSelected-syncOptionsList">
        <li class="DatasetSelected-syncOptionsItem">
          <div class="RadioButton">
            <button class="RadioButton-input js-interval-0 <%- interval === 0 ? 'is-checked' : '' %>"></button>
            <label class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- _t('components.modals.add-layer.imports.selected-state.never') %></label>
          </div>
        </li>
        <li class="DatasetSelected-syncOptionsItem">
          <div class="RadioButton <%- !userCanSync ? 'is-disabled' : '' %>">
            <button class="RadioButton-input js-interval-1 <%- interval === 3600 ? 'is-checked' : '' %>"></button>
            <label class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- _t('components.modals.add-layer.imports.selected-state.every-hour') %></label>
          </div>
        </li>
        <li class="DatasetSelected-syncOptionsItem">
          <div class="RadioButton <%- !userCanSync ? 'is-disabled' : '' %>">
            <button class="RadioButton-input js-interval-2 <%- interval === 86400 ? 'is-checked' : '' %>"></button>
            <label class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- _t('components.modals.add-layer.imports.selected-state.every-day') %></label>
          </div>
        </li>
        <li class="DatasetSelected-syncOptionsItem">
          <div class="RadioButton <%- !userCanSync ? 'is-disabled' : '' %>">
            <button class="RadioButton-input js-interval-3 <%- interval === 604800 ? 'is-checked' : '' %>"></button>
            <label class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- _t('components.modals.add-layer.imports.selected-state.every-week') %></label>
          </div>
        </li>
        <li class="DatasetSelected-syncOptionsItem">
          <div class="RadioButton <%- !userCanSync ? 'is-disabled' : '' %>">
            <button class="RadioButton-input js-interval-4 <%- interval === 2592000 ? 'is-checked' : '' %>"></button>
            <label class="CDB-Text CDB-Size-medium u-altTextColor u-lSpace"><%- _t('components.modals.add-layer.imports.selected-state.every-month') %></label>
          </div>
        </li>
      </ul>
    </div>
    <% if (showUpgrade) { %>
      <div class="Upgrade-info">
        <p class="CDB-Text CDB-Size-medium u-ellipsis u-secondaryTextColor">
         <% featuresLink = '<a href="https://carto.com/pricing">' + _t('components.modals.add-layer.imports.selected-state.more-features') + '</a>' %>
          <%- _t('components.modals.add-layer.imports.selected-state.upgrade-desc', { features: featuresLink }) %>
        </p>
        <div class="Upgrade-infoActions">
          <% if (showTrial) { %>
            <p class="CDB-Text CDB-Size-medium u-ellipsis is-semibold u-rSpace--xl"><%- _t('components.modals.add-layer.imports.selected-state.free-trial', { days: 14 }) %></p>
          <% } %>
          <a href="<%- upgradeUrl %>" class="CDB-Button CDB-Button--secondary">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.add-layer.imports.selected-state.upgrade') %></span>
          </a>
        </div>
      </div>
    <% } %>
  </div>
<% } %>
