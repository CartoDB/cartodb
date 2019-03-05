# Disable XML parameter parsing, see:
# http://www.insinuator.net/2013/01/rails-yaml/
ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML)

# Adds an extension method previously found in a Vizzuality fork of rails-sequel
module SequelRails
  def self.connection
    @db ||= ::Sequel.synchronize { ::Sequel::DATABASES.first }
  end
end
