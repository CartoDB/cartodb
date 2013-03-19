# encoding: utf-8

module CartoDB
  module Relocator
    class RDBMS
      def initialize(connection)
        @connection = connection
      end #initialize

      def rename_user(existing_username, new_username)
        connection.run("
          ALTER USER #{existing_username}
          RENAME TO #{new_username}
        ")
      end #rename_user

      def create_user(username, password)
        connection.run("
          CREATE USER #{username} PASSWORD '#{password}'
        ")
      end #create_user

      def set_password(username, password)
        connection.run("
          ALTER USER #{username} PASSWORD #{password}
        ")
      end #set_password

      def create_database(database_name, owner)
        connection.run("
          CREATE DATABASE #{database_name}
          WITH TEMPLATE = template_postgis
          OWNER = #{owner}
          ENCODING = 'UTF8'
          CONNECTION LIMIT=-1
        ")
      end #create_database

      private

      attr_accessor :connection
    end # RDBMS
  end # Relocator
end # CartoDB

