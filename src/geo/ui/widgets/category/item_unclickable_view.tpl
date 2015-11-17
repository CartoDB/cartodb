<li class="Widget-listItem">
  <div class="Widget-listItemInner <%- isDisabled ? 'is-disabled' : '' %>">
    <div class="Widget-contentSpaced">
      <p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
      <p class="Widget-textSmaller" title="<%- value %>"><%- value %></p>
    </div>
    <div class="Widget-progressBar">
      <div class="Widget-progressState <% isAggregated ? 'Widget-progressState--pattern' : '' %>" style="width: <%- percentage %>%"></div>
    </div>
  </div>
</li>
