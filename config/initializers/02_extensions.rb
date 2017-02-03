# Disable XML parameter parsing, see:
# http://www.insinuator.net/2013/01/rails-yaml/
ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML)

# Patches for Ruby 2.4
class ActiveSupport::Duration
  def coerce(other)
    [other, to_i]
  end
end

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
