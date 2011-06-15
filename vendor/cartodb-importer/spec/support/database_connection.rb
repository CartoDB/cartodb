# coding: UTF-8

module CartoDB
  class DatabaseConnection
    def self.connection
      @@connection ||= nil
      if @@connection
        @@connection
      else
        c = Sequel.connect('postgres://postgres:@localhost:5432/cartodb_importer_test')
        begin
          c.test_connection
          @@connection = c
        rescue
          c = Sequel.connect('postgres://postgres:@localhost:5432')
          c.run("create database cartodb_importer_test")
          @@connection = Sequel.connect('postgres://postgres:@localhost:5432')
        end
        return @@connection
      end
    end
  end
end