class RecordNotFound < StandardError; end

class CartoDB::EmtpyFile < StandardError; end
class CartoDB::InvalidUser < StandardError; end
class CartoDB::InvalidTableName < StandardError; end
class CartoDB::InvalidColumnName < StandardError; end
class CartoDB::InvalidGeomType < StandardError; end
class CartoDB::InvalidSRID < StandardError; end
class CartoDB::InvalidGeoJSONFormat < StandardError; end
class CartoDB::QueryNotAllowed < StandardError; end
class CartoDB::TableNotExists < StandardError; end


class CartoDB::ErrorRunningQuery < StandardError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
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

class CartoDB::InvalidType < StandardError
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

class CartoDB::EmtpyAttributes < StandardError
  attr_accessor :error_message
  def initialize(message)
    @error_message = message
    Rails.logger.info "========== CartoDB::EmtpyAttributes ==========="
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