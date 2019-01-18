<div class="Form-row">
  <div class="Form-rowLabel">
    <label class="CDB-Text CDB-Size-medium js-category"><%- _t('components.modals.add-layer.imports.twitter.category') %> <%- category %></label>
  </div>
  <div class="Form-rowData Form-rowData--longer">
    <input type="text" <% if (disabled) { %>disabled="disabled"<% } %> class="CDB-Text CDB-Size-medium Form-input Form-input--longer has-icon js-terms <%- disabled ? 'is-disabled' : '' %>" value="<%- terms.join(",") %>" placeholder="<%- _t('components.modals.add-layer.imports.twitter.terms-placeholder') %>" />
    <i class="CDB-IconFont CDB-IconFont-twitter Form-inputIcon"></i>
  </div>
</div>
