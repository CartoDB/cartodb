module CartoDB
  module Factories
    def new_table(attributes = {})
      attributes = attributes.dup
      attributes[:name] ||= String.random(10)
      user_id = if attributes[:user_id].nil?
        create_user.id
      else
        attributes.delete(:user_id)
      end
      table = Table.new(attributes)
      table.user_id = user_id
      table
    end

    def create_table(attributes = {})
      table = new_table(attributes)
      table.save
      table.reload
    end
  end
end