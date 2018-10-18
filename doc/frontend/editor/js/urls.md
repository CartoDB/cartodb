URLs within the application might be necessary.

To avoid constructing these URLS manually, i.e. concatenating strings and thus duplicating logic, there are convenient ways of constructing them. Depending on context (server- or client-side) you might take one approach or another.

## Rails
In Rails simply use the [standard routing helper methods](http://guides.rubyonrails.org/v3.2.21/routing.html). Have a look at  [routes.rb](https://github.com/CartoDB/cartodb/blob/master/config/routes.rb) for the semantic names and paths available.

## Client-side
For a current sub-app you can access URLs through the current router model, e.g. `router.currentUrl()`.

For a URL that is associated with a specific model you can access the URL by call `.viewUrl()` on that model, and chaining methods afterwards to "drill down" on what (available) path you want, e.g.
- `user.viewUrl().dashboard().datasets())`, the URL to a user's datasets on the dashboard.
- `vis.viewUrl().public()`, the URL to a visualization's public page.

See the [models](https://github.com/CartoDB/cartodb/blob/master/lib/assets/test/spec/cartodb/common/urls) for available models and methods.
