<div class="Widget-listItemInner <%- isDisabled ? 'is-disabled' : '' %>">
  <div class="Widget-contentSpaced">
    <p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
    <p class="Widget-textSmaller" title="<%- value %>"><%- prefix %><%- value %><%- suffix %></p>
  </div>
  <div class="Widget-progressBar">
    <div class="Widget-progressState Widget-progressState--pattern <%- isAggregated ? 'Widget-progressState--inactive' : '' %>"
      style="width: <%- percentage %>%; background-color: <%- customColor ? color : '' %>"></div>
  </div>
</div>
