<div class="ImportButton__overlay gtm-connectors-<%= name %>"></div>
<div class="ImportButton__content js-content">
  <div class="ImportButton__taglist">
    <div class="ImportButton__tag ImportButton__tag--enterprise"><%- _t('components.modals.add-layer.imports.tags.enterprise') %></div>
    <div class="ImportButton__tag ImportButton__tag--beta"><%- _t('components.modals.add-layer.imports.tags.beta') %></div>
    <div class="ImportButton__tag ImportButton__tag--soon"><%- _t('components.modals.add-layer.imports.tags.soon') %></div>
    <div class="ImportButton__tag ImportButton__tag--new"><%- _t('components.modals.add-layer.imports.tags.new') %></div>
  </div>
  <i class='ImportButton__icon is-<%- name %>'></i>
  <span class="ImportButton__name"><%= cdb.core.sanitize.html(title || name) %></span>
</div>
