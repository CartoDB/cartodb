<button type="button" class="CDB-Widget-listItemInner CDB-Widget-listItemInner--fullSpace CDB-Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
  <span class="CDB-Widget-checkbox <%- isDisabled ? '' : 'is-checked' %>"></span>
  <div class="u-lSpace--xl">
    <div class="CDB-Widget-contentSpaced">
      <p class="CDB-Text is-semibold u-upperCase CDB-Size-medium u-ellipsis u-rSpace--xl" title="<%- name %>"><%- name %></p>
      <p class="CDB-Text CDB-Size-small u-secondaryTextColor" title="<%- value %>"><%- prefix %><%- formattedValue %><%- suffix %></p>
    </div>
    <div class="CDB-Widget-progressBar">
      <div class="CDB-Widget-progressState is-accepted" style="width: <%- percentage %>%"></div>
    </div>
  </div>
</button>
