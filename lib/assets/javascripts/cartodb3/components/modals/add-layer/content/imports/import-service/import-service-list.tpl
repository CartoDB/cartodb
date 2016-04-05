<div class="ServiceList-header">
  <p class="ServiceList-headerTitle"><%- size %> <%- pluralize %> found in <%- title %></p>
</div>
<div class="ServiceList-body">
  <% if (size > 0) { %>
  <ul class="ServiceList-items"></ul>
  <% } else { %>
    <div class="IntermediateInfo ServiceList-empty">
      <div class="LayoutIcon">
        <i class="CDB-IconFont CDB-IconFont-lens"></i>
      </div>
      <h4 class="IntermediateInfo-title">Oouch! There is no results</h4>
      <p class="DefaultParagraph">We haven't found any valid file from your account</p>
    </div>
  <% } %>
</div>
