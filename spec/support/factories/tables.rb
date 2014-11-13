module CartoDB
  module Factories
    def new_table(attributes = {})
      attributes = attributes.dup
      table = ::Table.new(attributes)
      table.user_id = if attributes[:user_id].nil?
        UUIDTools::UUID.timestamp_create.to_s
      else
        attributes.delete(:user_id)
      end

      table.name = if attributes.keys.include?(:name) && attributes[:name] == nil
        attributes.delete(:name)
        nil
      else
        attributes[:name] || String.random(10)
      end
      
      table
    end

    def create_table(attributes = {})
      table = new_table(attributes)
      table.save
      table.reload

    end
  end
end
