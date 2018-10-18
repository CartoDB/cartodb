<button class="
  CDB-Button
  CDB-Button--noPadding
  js-delete
  <% if (disableDelete) { %> is-disabled<% } %>
">
  <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase
  <% if (isDelete) { %> u-errorTextColor<% } else { %> u-actionTextColor<% } %>">
    <%- labelDelete %>
  </span>
</button>
<button class="CDB-Button CDB-Button--loading CDB-Button--primary js-save
<% if (isDisabled) { %> is-disabled<% } %>
<% if (!isDone) { %> is-loading<% } %>">
  <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- labelSave %></span>
   <div class="CDB-Button-loader CDB-LoaderIcon is-white">
     <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
       <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
     </svg>
   </div>
</button>
