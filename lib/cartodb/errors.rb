class RecordNotFound < StandardError; end
class NoHTML5Compliant < Exception; end

module CartoDB

  class BaseCartoDBError < StandardError
    APPENDED_MESSAGE_PREFIX = '. Original Message: '

    def initialize(message, parent_exception = nil)
      if parent_exception.nil?
        super(message)
      else
        super(message + APPENDED_MESSAGE_PREFIX + parent_exception.message)
        set_backtrace(parent_exception.backtrace)
      end
    end
  end

  class InvalidUser < StandardError; end
  class InvalidTableName < StandardError; end
  class InvalidColumnName < StandardError; end
  class InvalidGeomType < StandardError; end
  class InvalidSRID < StandardError; end
  class InvalidGeoJSONFormat < StandardError; end
  class BoundingBoxError < StandardError; end
  class QueryNotAllowed < StandardError; end

  class InvalidMember < StandardError; end

  class TableError < StandardError; end
  class CartoDBfyInvalidID < StandardError; end
  class CartoDBfyError < StandardError; end

  class InvalidInterval < StandardError
    def detail
      Cartodb.error_codes[:invalid_interval]
    end
  end

  # importer errors
  class EmptyFile < StandardError
    def detail
      Cartodb.error_codes[:empty_file]
    end
  end

  class InvalidUrl < StandardError
    def detail
      Cartodb.error_codes[:url_error]
    end
  end

  class InvalidFile < StandardError
    def detail
      Cartodb.error_codes[:file_error]
    end
  end

  class TableCopyError < StandardError
    def detail
      Cartodb.error_codes[:table_copy_error]
    end
  end

  class QuotaExceeded < StandardError
    def detail
      Cartodb.error_codes[:quota_error].merge(:raw_error => self.message)
    end
  end

  class DataSourceError < BaseCartoDBError; end

  class ModelAlreadyExistsError < StandardError; end

  # database errors
  class DbError < StandardError
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

  class TableNotExists < DbError; end
  class ColumnNotExists < DbError; end
  class ErrorRunningQuery < DbError
    attr_accessor :db_message # the error message from the database
    attr_accessor :syntax_message # the query and a marker where the error is

    def initialize(message)
      super(message)
      @db_message = message.split("\n")[0]
      @syntax_message = message.split("\n")[1..-1].join("\n")
    end
  end

  class InvalidType < DbError
    attr_accessor :db_message # the error message from the database
    attr_accessor :syntax_message # the query and a marker where the error is

    def initialize(message)
      @db_message = message.split("\n")[0]
      @syntax_message = message.split("\n")[1..-1].join("\n")
      CartoDB::StdoutLogger.info 'InvalidType', message
    end
  end

  class InvalidQuery < StandardError
    attr_accessor :message
    def initialize
      @message = 'Only SELECT statement is allowed'
    end
  end

  class EmptyAttributes < StandardError
    attr_accessor :error_message
    def initialize(message)
      @error_message = message
      CartoDB::StdoutLogger.info 'EmptyAttributes', message
    end
  end

  class InvalidAttributes < StandardError
    attr_accessor :error_message
    def initialize(message)
      @error_message = message
      CartoDB::StdoutLogger.info 'InvalidAttributes', message
    end
  end

  class NonConvertibleData < StandardError; end

  class CentralCommunicationFailure < StandardError

    attr_accessor :message, :response_code, :errors

    def initialize(response)
      @message = "Application server responded with http #{response.code}: #{response.body}"
      @response_code = response.code
      @errors = JSON.parse(response.body)['errors']
    rescue
      @errors = ['Couldn\'t parse response errors.']
    end

    def user_message
      "There was a problem with authentication server. #{@errors.join(' ; ')}"
    end
  end

  class UnauthorizedError < StandardError
    def initialize(user, object)
      object_class = object.class

      message = "#{object_class.name}"

      message += " with id '#{object.id}'" if object_class.method_defined?(:id)

      message += " is forbidden for User '#{user.username}'"

      super(message)
    end
  end
end
