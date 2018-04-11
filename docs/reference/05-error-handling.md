## Error Handling

Most of the errors fired by the library are handled by the client itself. The client will trigger a `CartoError` every time an error happens.

A cartoError is an object containing a single `message` field with a string explaining the error.

Some methods in CARTO.js are asynchronous. This means that they return a promise that will be fulfilled when the asynchronous work is done or rejected with a `CartoError` when an error occurs.


```javascript
// All errors are passed to the client.
client.on(carto.events.ERROR, cartoError => {
    console.error(cartoError.message):
})

// .addLayer() is async.
client.addLayer(newLayer)
    .then(successCallback)
    .catch(errorCallback);
```
