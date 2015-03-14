module CartoDB
  module Factories
    def new_table(attributes = {})
      attributes = attributes.dup
      user_table = ::UserTable.new(attributes)
      table = ::Table.new(user_table)
      table.user_table.user_id = if attributes[:user_id].nil?
        UUIDTools::UUID.timestamp_create.to_s
      else
        attributes.delete(:user_id)
      end

      table.user_table.name = if attributes.keys.include?(:name) && attributes[:name] == nil
        attributes.delete(:name)
        nil
      else
        attributes[:name] || String.random(10)
      end
      
      table
    end

    def create_table(attributes = {})
      table = new_table(attributes)
      table.user_table.save
      table.user_table.reload
      table
    end
  end
end
