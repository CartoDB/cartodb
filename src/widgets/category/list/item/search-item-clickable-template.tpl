<button type="button" class="CDB-Widget-listItemInner CDB-Widget-listItemInner--fullSpace CDB-Widget-listButton js-button <%- isDisabled ? 'is-disabled' : '' %>">
  <span class="CDB-Widget-checkbox <%- isDisabled ? '' : 'is-checked' %>"></span>
  <div class="u-lSpace--xl">
    <div class="CDB-Widget-contentSpaced">
      <p class="CDB-Text is-semibold is-upper CDB-Size-medium" title="<%- name %>"><%- name %></p>
      <p class="CDB-Widget-textSmaller" title="<%- value %>"><%- prefix %><%- value %><%- suffix %></p>
    </div>
    <div class="CDB-Widget-progressBar">
      <div class="CDB-Widget-progressState" style="width: <%- percentage %>%"></div>
    </div>
  </div>
</button>
