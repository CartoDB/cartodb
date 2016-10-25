<ul class="CDB-Dropdown-list CDB-Text CDB-Size-medium">
  <li class="CDB-Dropdown-item">
    <button class="CDB-Dropdown-link js-toggleCollapsed">
      Toggle widget
        <div>
        <% if (collapsed) { %>
          <input class="CDB-Toggle js-inputCollapsed" checked="checked" type="checkbox" name="collapsed">
        <% } else { %>
          <input class="CDB-Toggle js-inputCollapsed" type="checkbox" name="collapsed">
        <% } %>
          <span class="u-iBlock CDB-ToggleFace"></span>
        </div>
    </button>
  </li>

  <% if (flags.normalizeHistogram) { %>
  <li class="CDB-Dropdown-item">
    <div class="CDB-Dropdown-link js-toggleNormalized">
      Show totals
      <div>
        <% if (normalized) { %>
        <input class="CDB-Toggle u-iBlock js-inputNormalized" type="checkbox" name="normalized">
        <% } else { %>
        <input class="CDB-Toggle u-iBlock js-inputNormalized" checked="checked" type="checkbox" name="normalized">
        <% } %>
        <span class="u-iBlock CDB-ToggleFace"></span>
      </div>
    </div>
  </li>
  <% } %>
  <li class="CDB-Dropdown-item">
    <button type="button" class="CDB-Dropdown-link u-ellipsis u-actionTextColor js-listItem" data-val="edit-widget" title="Edit">Edit</button>
  </li>
  <li class="CDB-Dropdown-item">
    <button type="button" class="CDB-Dropdown-link u-ellipsis u-errorTextColor js-listItem" title="Delete...">Delete...</button>
  </li>
</ul>
