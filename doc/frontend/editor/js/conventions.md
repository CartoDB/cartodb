This article describes conventions we defined for the JS code.

## Backbone

### Views

#### Event names
Use `done` and `fail` for event names, to be consistent with naming convention used in [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR) objects (typically returned from a Backbone model/collection on an asynchronious operation. Typically used for dialogs, where the final operation and its outcome should have some implication in the UI (e.g. refresh list, hide/show some view etc.)

Example:
```js
aDialogView
  .bind('done', function() {
    console.log('dialog is done :)');
    this.collection.fetch();
  .bind('fail', function(err) {
    console.log('something failed :/');
    // Do nothing for now
  };
```
