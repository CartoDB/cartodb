module CartoDB
  module SequelConnectionHelper
    def close_sequel_connection(connection)
      connection.disconnect
      # Sequel keeps a list of all databases it has connected to that is never deleted
      # We must manually delete the connection or it is never garbage collected, leaking memory
      # See https://github.com/jeremyevans/sequel/blob/3.42.0/lib/sequel/database.rb#L10
      Sequel.synchronize { Sequel::DATABASES.delete(connection) }
    end
  end
end
