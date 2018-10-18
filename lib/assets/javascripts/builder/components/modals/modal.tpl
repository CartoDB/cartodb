<% if (!escapeOptionsDisabled) { %>
  <% if (breadcrumbsEnabled) { %>
    <div class="Dialog-headerWrapper">
      <ul class="Editor-breadcrumb">
        <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium u-actionTextColor">
          <button class="js-close">
            <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large u-rSpace"></i>

            <span class="Editor-breadcrumbLink"><%- _t('back') %></span>
          </button>
        </li>
      </ul>
    </div>
  <% } else { %>
    <button class="CDB-Shape js-close Dialog-closeBtn">
      <div class="CDB-Shape-close is-blue is-huge"></div>
    </button>
  <% } %>
<% } %>

<div class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper <% if (breadcrumbsEnabled) { %>Dialog-contentWrapper--withBreadcrumbs<% } %> js-content"></div>
