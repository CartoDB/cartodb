module CartoDB
  module Factories
    def new_table(attributes = {})
      attributes = attributes.dup
      attributes[:name] ||= String.random(10)
      if attributes[:user_id].nil?
        user = create_user
        attributes[:user_id] = user.id
      end
      Table.new(attributes)
    end

    def create_table(attributes = {})
      table = new_table(attributes)
      table.save
    end
  end
end