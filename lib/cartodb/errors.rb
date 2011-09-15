class RecordNotFound < StandardError; end

class CartoDB::EmptyFile < StandardError; end
class CartoDB::InvalidUser < StandardError; end
class CartoDB::InvalidTableName < StandardError; end
class CartoDB::InvalidColumnName < StandardError; end
class CartoDB::InvalidGeomType < StandardError; end
class CartoDB::InvalidSRID < StandardError; end
class CartoDB::InvalidGeoJSONFormat < StandardError; end
class CartoDB::QueryNotAllowed < StandardError; end

class CartoDB::DbError < StandardError
  attr_accessor :message
  def initialize(msg)
    # Example of an error (newline included):
    # Pgerror: error:  relation "antantaric_species" does not exist
    # LINE 1: insert into antantaric_species (name_of_species,family) valu...
    
    # So we suppose everything we need is in the first line
    @message = msg.split("\n").first.gsub(/pgerror: error:/i,'').strip
  end
  def to_s; @message; end
end

class CartoDB::TableNotExists < CartoDB::DbError; end

class CartoDB::ColumnNotExists < CartoDB::DbError; end

class CartoDB::ErrorRunningQuery < CartoDB::DbError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
    super(message)
    @db_message = message.split("\n")[0]
    @syntax_message = message.split("\n")[1..-1].join("\n")
  end
end

class CartoDB::InvalidQuery < StandardError
  attr_accessor :message
  def initialize
    @message = "Only SELECT statement is allowed"
  end
end

class CartoDB::InvalidType < CartoDB::DbError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
    @db_message = message.split("\n")[0]
    @syntax_message = message.split("\n")[1..-1].join("\n")
    Rails.logger.info "========== CartoDB::InvalidType ==========="
    Rails.logger.info message
    Rails.logger.info "==========================================="
  end
end

class CartoDB::EmptyAttributes < StandardError
  attr_accessor :error_message
  def initialize(message)
    @error_message = message
    Rails.logger.info "========== CartoDB::EmptyAttributes ==========="
    Rails.logger.info message
    Rails.logger.info "==============================================="
  end
end

class CartoDB::InvalidAttributes < StandardError
  attr_accessor :error_message
  def initialize(message)
    @error_message = message
    Rails.logger.info "========== CartoDB::InvalidAttributes ==========="
    Rails.logger.info message
    Rails.logger.info "================================================="
  end
end
