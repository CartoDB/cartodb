<button type="button" class="CDB-Widget-listItemInner CDB-Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
  <div class="CDB-Widget-contentSpaced">
    <p class="CDB-Widget-textSmall CDB-Widget-textSmall--bold CDB-Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
    <p class="CDB-Widget-textSmaller" title="<%- value %>"><%- prefix %><%- formattedValue %><%- suffix %></p>
  </div>
  <div class="CDB-Widget-progressBar">
    <div class="CDB-Widget-progressState <%- isAggregated ? 'CDB-Widget-progressState--pattern' : '' %>" style="width: <%- percentage %>%; background-color: <%- customColor ? color : '' %>"></div>
  </div>
</button>
