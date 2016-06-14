<ul class="CodeMirror-error">
  <li class="CodeMirror-errorMessage u-lSpace--xl u-rSpace--xl">
    <%- _t('components.codemirror.syntax-error') %>. <%- _t('components.codemirror.line') %> <%- line %>: <span><%- message %></span>
  </li>
  <li class="CodeMirror-errorDocs">
    <a href="https://docs.cartodb.com/cartodb-platform/cartocss/" target="_black"><%- _t('components.codemirror.docs') %></a>
  </li>
</ul>