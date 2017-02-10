# Disable XML parameter parsing, see:
# http://www.insinuator.net/2013/01/rails-yaml/
ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML)

# Patches for Ruby 2.4
if RUBY_VERSION >= "2.4.0"
  # ActiveSupport dates, e.g: 3.days (fixed in Rails 5, and no sooner)
  class ActiveSupport::Duration
    def coerce(other)
      [other, to_i]
    end
  end

  # ActiveRecord 3.2. Fixed in Arel 7.1.0
  require 'arel'
  module Arel
    module Visitors
      class Dot
        alias :visit_Integer :visit_String
      end

      class ToSql
        alias :visit_Integer :literal
      end

      class DepthFirst
        alias :visit_Integer :terminal
      end
    end
  end
end
