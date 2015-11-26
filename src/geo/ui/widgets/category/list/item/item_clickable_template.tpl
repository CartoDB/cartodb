<button type="button" class="Widget-listItemInner Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
  <div class="Widget-contentSpaced">
    <p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
    <p class="Widget-textSmaller" title="<%- value %>"><%- prefix %><%- formattedValue %><%- suffix %></p>
  </div>
  <div class="Widget-progressBar">
    <div class="Widget-progressState <%- isAggregated ? 'Widget-progressState--pattern' : '' %>" style="width: <%- percentage %>%; background-color: <%- customColor ? color : '' %>"></div>
  </div>
</button>
