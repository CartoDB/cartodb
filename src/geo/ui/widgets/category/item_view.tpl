<li class="Widget-listItem">
  <button type="button" class="Widget-listItemInner Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
    <div class="Widget-contentSpaced">
      <p class="Widget-textSmall Widget-textSmall--bold Widget-textSmall--upper" title="<%- name %>"><%- name %></p>
      <p class="Widget-textSmaller" title="<%- value %>"><%- value %></p>
    </div>
    <div class="Widget-progressBar">
      <div class="Widget-progressState" style="width: <%- percentage %>%"></div>
    </div>
  </button>
</li>
