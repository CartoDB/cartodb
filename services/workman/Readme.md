= Purpose

Workman is a general-purpose scheduler for asynchronous workers, that aims to
be decoupled from the backend queuing provider, and managed from a HTTP REST
API.

= Implementation details

Currently support for queuing backends is limited to Resque.

= Job execution

Workman will execute all job types that are defined in command classes under
commands/ (TO BE IMPLEMENTED)

