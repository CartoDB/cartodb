module CartoDB
  class ImportDatabaseConnection
    def self.connection
      @@connection ||= nil
      if @@connection
        @@connection
      else
        c = ::Sequel.connect('postgres://postgres:@localhost:5432/cartodb_importer_test')
        begin
          c.test_connection
          @@connection = c
        rescue StandardError
          c = ::Sequel.connect('postgres://postgres:@localhost:5432')
          c.run <<-SQL
CREATE DATABASE cartodb_importer_test
WITH TEMPLATE = template_postgis
OWNER = postgres
SQL
          @@connection = ::Sequel.connect('postgres://postgres:@localhost:5432/cartodb_importer_test')
        end
        return @@connection
      end
    end

    def self.drop
      @@connection.disconnect
      @@connection = nil
      begin
        c = ::Sequel.connect('postgres://postgres:@localhost:5432')
        c.run "DROP DATABASE cartodb_importer_test"
      rescue StandardError => e
        raise e
      end
      return true
    end
  end
end
