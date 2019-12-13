ActionDispatch::Request.parameter_parsers = ActionDispatch::Request.parameter_parsers.except(:xml)

# Adds an extension method previously found in a Vizzuality fork of rails-sequel
module SequelRails
  def self.connection
    @db ||= ::Sequel.synchronize { ::Sequel::DATABASES.first }
  end
end
