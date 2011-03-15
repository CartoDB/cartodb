class RecordNotFound < StandardError; end

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