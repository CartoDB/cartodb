# V4 API

This folder contains the source files used in the `v4 public api`.

This api build using wrappers over the internal objects, those wrappers have an easy-to-use public methods,
the reference to the internal objects can be obtained  with the `$getInternalModel` method.

The `$` before a method name is a naming convetion. Those methods sall not be exposed in the public API
but can be used from different files. (Public only for developers).


