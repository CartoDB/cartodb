# Logging

General guidelines to be applied project-wide are described in our [internal wiki](http://doc-internal.cartodb.net/platform/guidelines.html#structured-logging), while this page focuses on specific usage from the CartoDB application.

## Important context

Log messages are processed by our ELK stack. Each log message maps into a set of fields, which then are inserted in Elaticsearch. These fields have an associated type, which is automatically assigned by Elaticsearch when a new field name is received.

This has the caveat that if a subsequent log message is received with the same field name but a different type (ex: 1 vs "1"), the log message is lost because the insertion in the Elasticsearch index fails.

To mitigate this, **please review existing logging messages to check the format used** and existing logging conventions before writing new entries.

## Logger structure

The core of the logging sytem (`Carto::Common::Logger`) is in our shared code repository, [cartodb-common](https://github.com/CartoDB/cartodb-common). It contains modifications of the Rails standard logger: JSON formatting and additional attributes for the default logs.

This repository wraps `Carto::Common::Logger` with a `::LoggerHelper` class, which adds some serialization logic and provides the following methods:

```ruby
log_debug(message: 'Foo')
log_info(message: 'Foo')
log_warning(message: 'Foo')
log_error(message: 'Foo')   # Reports to Rollbar
log_fatal(message: 'Foo')   # Reports to Rollbar
```

## Guidelines

**1. Be explicit about the attribute names logged**

Use:

```ruby
log_error(message: 'Foo', table_id: 123)
```

Rather than:

```ruby
log_error(message: 'Foo', table: 123)
```

**2. Reuse existing fields when possible**

| Field name     | Kibana field    | Kibana type | Description      |
| -------------- | --------------- | ----------- | ---------------- |
| `message`      | `event_message` | String      | Self-descriptive |
| `current_user` | `cdb-user`      | String      | Username performing (or affected by) the action |
| `target_user`  | `target_user`   | String      | Username affected by the action. Use **only** when the actor of the action is not the same as the receiver |
| `organization` | `organization`  | String      | Name of the organization |
| `exception`    | `exception`     | Nested JSON | An `Exception` object |
| `error_detail` | `error_detail`  | String      | Additional error details |

**3. Abstract common logger information**

If the logging messages written in a class share a set of common fields, try to abstract it by defining a `log_context` method.

For example:

```ruby
module Carto
  module Api
    class GroupsController < ::Api::ApplicationController

      def create
        # ...
      rescue StandardError => e
        log_error(exception: e)
        head 500
      end

      def update
        # ...
      rescue StandardError => e
        log_error(exception: e)
        head 500
      end

      private

      def log_context
        super.merge(group: @group, organization: @organization)
      end

    end
  end
end

```

## Examples

Logging the current user:

```ruby
log_info(message: 'Foo', current_user: Carto::User.first)
log_info(message: 'Foo', current_user: User.first)
log_info(message: 'Foo', current_user: 'some-username')
# Serialized as:
# { 'event_message': 'Foo', 'cdb-user': 'some-username' }
```

Logging an action User A performed on User B:

```ruby
log_info(message: 'Foo', current_user: user_a, target_user: user_b)
# Serialized as:
# { 'event_message': 'Foo', 'cdb-user': 'username-a', 'target_user': 'username-b' }
```

Logging organizations:

```ruby
log_info(message: 'Foo', organization: Carto::Organization.first)
log_info(message: 'Foo', organization: Organization.first)
log_info(message: 'Foo', organization: 'organization-name')
# Serialized as:
# { 'event_message': 'Foo', 'organization': 'organization-name' }
```

Logging a captured exception:

```ruby
log_error(message: 'Foo', exception: StandardError.new('My error'))
# Serialized as:
# {
#   'event_message': 'Foo',
#   'exception': {
#     'class': 'StandardError',
#     'message': 'My error',
#     'backtrace_hint': ['line_1', 'line_2', 'line_3']
#   }
# }
```

Logging a failed ActiveRecord validation:

```ruby
invalid_user.save
log_warning(message: 'Unable to save user', current_user: invalid_user, error_detail: invalid_user.errors.full_messages.join(','))
```
