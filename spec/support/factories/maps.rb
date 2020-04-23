module CartoDB
  module Factories
    def new_map(attributes = {})
      attributes = attributes.dup
      map = ::Map.new(attributes)
      map.user_id = if attributes[:user_id].nil?
        Carto::UUIDHelper.random_uuid
        #create_user.id
      else
        attributes.delete(:user_id)
      end
      map
    end

    def create_map(attributes = {})
      map = new_map(attributes)
      map.save
      map.reload
    end
  end
end
