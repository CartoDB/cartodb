<ul class="CDB-Dropdown-list CDB-Text CDB-Size-medium">
  <li class="CDB-Dropdown-item">
    <div class="CDB-Dropdown-link js-toggleCollapsed">
      Toggle widget
        <div>
        <% if (collapsed) { %>
          <input class="CDB-Toggle js-inputCollapsed" checked="checked" type="checkbox" name="collapsed">
        <% } else { %>
          <input class="CDB-Toggle js-inputCollapsed" type="checkbox" name="collapsed">
        <% } %>
          <span class="u-iBlock CDB-ToggleFace"></span>
        </div>
    </div>
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
</ul>
