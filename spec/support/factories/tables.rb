module CartoDB
  module Factories
    def new_table(attributes = {})
      attributes = attributes.dup
      attributes[:name] ||= String.random(10)
      attributes[:user_id] ||= rand(1000)
      Table.new(attributes)
    end

    def create_table(attributes = {})
      table = new_table(attributes)
      table.save
    end
  end
end