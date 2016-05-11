<button type="button" class="CDB-Widget-listItemInner CDB-Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
  <div class="CDB-Widget-contentSpaced">
    <p class="CDB-Text is-semibold u-upperCase CDB-Size-medium u-ellipsis u-rSpace--xl" title="<%- name %>"><%- name %></p>
    <p class="CDB-Text CDB-Size-small u-secondaryTextColor" title="<%- value %>"><%- prefix %><%- formattedValue %><%- suffix %></p>
  </div>
  <div class="CDB-Widget-progressBar">
    <div class="CDB-Widget-progressState <%- isAggregated ? 'CDB-Widget-progressState--pattern' : '' %> <%- isAccepted ? 'is-accepted' : '' %>" style="width: <%- percentage %>%; background-color: <%- customColor ? color : '' %>"></div>
  </div>
</button>
