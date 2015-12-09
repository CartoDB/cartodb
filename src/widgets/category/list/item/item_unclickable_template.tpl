<div class="CDB-Widget-listItemInner <%- isDisabled ? 'is-disabled' : '' %>">
  <div class="CDB-Widget-contentSpaced">
    <p class="CDB-Widget-textSmall CDB-Widget-textSmall--bold CDB-Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
    <p class="CDB-Widget-textSmaller" title="<%- value %>"><%- prefix %><%- formattedValue %><%- suffix %></p>
  </div>
  <div class="CDB-Widget-progressBar">
    <div class="CDB-Widget-progressState CDB-Widget-progressState--pattern <%- isAggregated ? 'CDB-Widget-progressState--inactive' : '' %>"
      style="width: <%- percentage %>%; background-color: <%- customColor ? color : '' %>"></div>
  </div>
</div>
