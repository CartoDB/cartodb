As a general rule setting variables and objects in global namespace is highly discouraged. Instead, the code related to the CartoDB should be placed in the `cdb.admin` namespace.

There are some use-cases where having a global objects makes things simpler and easier to maintain, see below.

### cdb.god
The `cdb.god` is a Backbone model which is intended to be used a global event bus to make it easier to bind and trigger to events that affects the global state in some way.

As a general rule accessing global objects is highly discouraged, but there are some use-cases where having a global mechanism makes things simpler and easier to maintain, e.g.:
- Global UI state changes
- Some UI action should have a side-effect in another view, but they either don't know about each other and/or are logically located far away from each other.

[Search for `cdb.god.`](https://github.com/CartoDB/cartodb/search?utf8=%E2%9C%93&q=cdb.god.)) in the source code you can see where it's currently applied.
