<div class="Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--<%- positiveOrNegativeStr %>">
    <i class="CDB-IconFont <%- areLocked ? 'CDB-IconFont-unlock' : 'CDB-IconFont-lock' %>"></i>
    <% if (itemsCount > 1) { %>
      <span class="Badge Badge--<%- positiveOrNegativeStr %> Dialog-headerIconBadge CDB-Text CDB-Size-small "><%- itemsCount %></span>
    <% } %>
  </div>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    You are about to <%- lockOrUnlockStr %> <%- itemsCount %> <%- contentTypePluralized %>.
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (areLocked) { %>
      <%- _t('components.modals.change-lock.description.locked', {
          thisOrTheseStr: thisOrTheseStr,
          contentTypePluralized: contentTypePluralized,
          itOrThemStr: itOrThemStr
        }) %>
    <% } else { %>
      <%- _t('components.modals.change-lock.description.unlocked', {
        thisOrTheseStr: thisOrTheseStr,
        contentTypePluralized: contentTypePluralized,
        itOrThemStr: itOrThemStr
      }) %>
    <% } %>
  </p>
</div>
<div class="Dialog-footer Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--secondary js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">cancel</span>
  </button>
  <button class="CDB-Button CDB-Button--primary CDB-Button--<%- positiveOrNegativeStr %> u-lSpace--xl js-ok">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">Ok, <%- lockOrUnlockStr %></span>
  </button>
</div>
