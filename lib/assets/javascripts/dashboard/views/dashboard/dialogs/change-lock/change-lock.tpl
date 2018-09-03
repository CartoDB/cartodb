<div class="Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--<%- positiveOrNegativeStr %>">
    <i class="CDB-IconFont <%- areLocked ? 'CDB-IconFont-unlock' : 'CDB-IconFont-lock' %>"></i>
    <% if (itemsCount > 1) { %>
      <span class="Badge Badge--<%- positiveOrNegativeStr %> Dialog-headerIconBadge CDB-Text CDB-Size-small "><%- itemsCount %></span>
    <% } %>
  </div>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    <%= _t('dashboard.views.dashboard.dialogs.change_lock.about_' + contentType, {lockOrUnlockStr: lockOrUnlockStr, smart_count: itemsCount})}) %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (areLocked) { %>
      <%= _t('dashboard.views.dashboard.dialogs.change_lock.unlock_' + contentType, {smart_count: itemsCount}) %>
      <%= _t('dashboard.views.dashboard.dialogs.change_lock.reveal', {smart_count: itemsCount}) %>
    <% } else { %>
      <%= _t('dashboard.views.dashboard.dialogs.change_lock.lock_' + contentType, {smart_count: itemsCount}) %>
      <%= _t('dashboard.views.dashboard.dialogs.change_lock.reveal', {smart_count: itemsCount}) %>
    <% } %>
  </p>
</div>
<div class="Dialog-footer Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.change_lock.cancel') %></span>
  </button>
  <button class="CDB-Button CDB-Button--primary CDB-Button--<%- positiveOrNegativeStr %> u-lSpace--xl js-ok">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.dashboard.dialogs.change_lock.ok') %><%- lockOrUnlockStr %></span>
  </button>
</div>
