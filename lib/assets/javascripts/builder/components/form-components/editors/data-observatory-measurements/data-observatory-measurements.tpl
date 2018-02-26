<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis
  <% if (isDisabled) { %> is-disabled <% } %>
  <% if (!label) { %> is-empty <% } %>
  <% if (isNull) { %> is-empty <% } %>"
  tabindex="0"
  title="<%- title %>">
  <% if (isLoading) { %>
    <div class="CDB-LoaderIcon CDB-LoaderIcon--small is-dark u-iBlock">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
    <span class="u-lSpace u-secondaryTextColor"><%- _t('components.backbone-forms.select.loading') %></span>
  <% } else { %>
    <%- label %>
  <% } %>
</div>

<div class="js-license CDB-Text CDB-FontSize-small u-altTextColor u-tSpace u-bSpace u-isHidden u-flex">
  <a href="https://cartodb.github.io/bigmetadata/licenses.html" target="_blank">
    <span class="u-tSpace u-bSpace DataObservatory-license"></span>
  </a>
</div>
