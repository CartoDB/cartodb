== Purpose

TrackRecord is a logging system for Ruby apps. It aims to support multiple
storage backends (e.g text files, Redis, Postgres, etc).

The logging logic is kept separate from the storage logic. This means a
different storage backend may be chosen for different use cases, depending on
the complexity and specific requirements of the queries that will mine the
stored log information.

