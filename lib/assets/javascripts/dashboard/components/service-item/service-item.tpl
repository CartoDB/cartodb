<div class="FormAccount-rowLabel">
  <label class="CDB-Text CDB-Size-medium is-semibold u-mainTextColor FormAccount-label"><%- title %></label>
</div>
<div class="FormAccount-rowData">
  <% if (connected) { %>
    <input class="CDB-InputText CDB-Text FormAccount-input FormAccount-input--med is-disabled" readonly value="Connected" />
  <% } else { %>
    <% if (state === "loading") { %>
      <button type="button" class="CDB-Size-medium FormAccount-link is-disabled"><%= _t('dashboard.components.service_item.service_item.connecting') %></button>
    <% } else { %>
      <button type="button" class="CDB-Size-medium FormAccount-link js-connect">
        <i class="ServiceIcon ServiceIcon--<%- name %>"></i><%= _t('dashboard.components.service_item.service_item.connect') %>
      </button>
    <% } %>
  <% } %>

  <div class="FormAccount-rowInfo FormAccount-rowInfo--marginLeft FormAccount-rowInfoText--multipleLines">
    <p class="FormAccount-rowInfoText <%- state === "error" ? 'FormAccount-rowInfoText--error' : '' %>">
    <% if (connected) { %>
      <% if (state === "error") { %>
        <%= _t('dashboard.components.service_item.service_item.error') %>
      <% } else if (state === "loading") { %>
        <%= _t('dashboard.components.service_item.service_item.disconneting') %>
      <% } else { %>
        <button type="button" class="CDB-Size-medium FormAccount-link js-disconnect"><%= _t('dashboard.components.service_item.service_item.disconnet') %></button>
      <% } %>
    <% } else { %>
      <% if (state === "error") { %>
        <%= _t('dashboard.components.service_item.service_item.disable_popup') %>
      <% } %>
    <% } %>
    </p>
  </div>
</div>
