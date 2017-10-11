# Disable XML parameter parsing, see:
# http://www.insinuator.net/2013/01/rails-yaml/
ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML)

# Adds an extension method previously found in a Vizzuality fork of rails-sequel
module SequelRails
  def self.connection
    @db ||= ::Sequel.synchronize { ::Sequel::DATABASES.first }
  end
end

# Patches for Ruby 2.4
# TODO: remove .dup when we no longer support buggy ruby version 2.2.4p230
if Gem::Version.new(RUBY_VERSION.dup) >= Gem::Version.new("2.4")
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
