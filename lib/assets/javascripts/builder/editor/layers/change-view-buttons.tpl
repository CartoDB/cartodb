<div class="Editor-contextSwitchers js-switchers
            <% if (context === 'table') { %>Editor-contextSwitchers--table<% } %> ">
  <ul class="u-flex u-alignRight Editor-contextSwitcher Editor-contextSwitcher--geom js-newGeometryView">
    <% if (queryGeometryModel === 'point' || !queryGeometryModel) { %>
      <li class="Editor-contextSwitcherItem js-newGeometryItem <% if (isReadOnly || !isVisible) { %>is-disabled<% } %>">
        <div class="Editor-contextSwitcherButton js-newGeometry" data-feature-type="point" data-tooltip="<%- _t('editor.edit-feature.add-point') %>">
          <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="a"/><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="c"/><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="e"/></defs><g fill="none" fill-rule="evenodd"><path fill="#FFF" d="M4 3h3v1H4v3H3V4H0V3h3V0h1"/><g transform="rotate(180 2.5 6)"><mask id="b" fill="#fff"><use xlink:href="#a"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" mask="url(#b)" stroke="#FFF" stroke-width="2"/></g><g transform="rotate(180 6 6)"><mask id="d" fill="#fff"><use xlink:href="#c"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" mask="url(#d)" stroke="#FFF" stroke-width="2"/></g><g transform="rotate(180 6 2.5)"><mask id="f" fill="#fff"><use xlink:href="#e"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" mask="url(#f)" stroke="#FFF" stroke-width="2"/></g></g></svg>
        </div>
      </li>
    <% } %>
    <% if (queryGeometryModel === 'line' || !queryGeometryModel) { %>
      <li class="Editor-contextSwitcherItem js-newGeometryItem <% if (isReadOnly || !isVisible) { %>is-disabled<% } %>">
        <div class="Editor-contextSwitcherButton js-newGeometry" data-feature-type="line" data-tooltip="<%- _t('editor.edit-feature.add-line') %>">
          <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="a"/><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="c"/></defs><g fill="none" fill-rule="evenodd"><path fill="#FFF" d="M11.5 5l-.707-.707-6.354 6.853.704.708"/><g transform="translate(11 2)"><mask id="b" fill="#fff"><use xlink:href="#a"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" mask="url(#b)" stroke="#FFF" stroke-width="2"/></g><g transform="translate(2 11)"><mask id="d" fill="#fff"><use xlink:href="#c"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" mask="url(#d)" stroke="#FFF" stroke-width="2"/></g><path fill="#FFF" d="M3 4H0V3h3V0h1v3h3v1H4v3H3"/></g></svg>
        </div>
      </li>
    <% } %>
    <% if (queryGeometryModel === 'polygon' || !queryGeometryModel) { %>
      <li class="Editor-contextSwitcherItem js-newGeometryItem <% if (isReadOnly || !isVisible) { %>is-disabled<% } %>">
        <div class="Editor-contextSwitcherButton js-newGeometry" data-feature-type="polygon" data-tooltip="<%- _t('editor.edit-feature.add-polygon') %>">
          <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="a"/><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="c"/><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" id="e"/></defs><g fill="none" fill-rule="evenodd"><path d="M13 11.5V5h-1v7h1m-.5-7.5l-.707-.707-7.647 7.353-.353.354.707.707.354-.353M4 3h3v1H4v3H3V4H0V3h3V0h1" fill="#FFF"/><path fill="#FFF" d="M4.5 13H12v-1H4v1"/><g transform="rotate(180 7 7)"><mask id="b" fill="#fff"><use xlink:href="#a"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" stroke="#FFF" stroke-width="2" mask="url(#b)"/></g><g transform="rotate(180 7 2.5)"><mask id="d" fill="#fff"><use xlink:href="#c"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" stroke="#FFF" stroke-width="2" mask="url(#d)"/></g><g transform="rotate(180 2.5 7)"><mask id="f" fill="#fff"><use xlink:href="#e"/></mask><path d="M0 2h3v1H0V2zm0-2h3v1H0V0zm2 1h1v1H2V1zM0 1h1v1H0V1z" stroke="#FFF" stroke-width="2" mask="url(#f)"/></g></g></svg>
        </div>
      </li>
    <% } %>
  </ul>

  <div class="u-flex u-alignCenter Editor-contextSwitcher Editor-contextSwitcher--view js-mapTableView"></div>
</div>
