require 'active_record'

module Carto

  class UserTable < ActiveRecord::Base

    def geometry_types
      table.geometry_types
    end

    def size
      row_count_and_size[:size]
    end

    def row_count
      row_count_and_size[:row_count]
    end

    def set_service(table)
      @table = table
    end

    def synchronization
      @synchronization ||= get_synchronization
    end

    private

    def table
      @table ||= ::Table.new( { user_table: self } )
    end

    def row_count_and_size
      @row_count_and_size ||= table.row_count_and_size
    end

    def get_synchronization
      Synchronization.where(user_id: user_id, name: name).first
    end

  end

end
