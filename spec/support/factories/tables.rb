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

    def create_visualization(user, attributes = {})
      headers = {'CONTENT_TYPE'  => 'application/json'}
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      post api_v1_visualizations_create_url(user_domain: user.username, api_key: user.api_key), visualization_template(user, attributes).to_json, headers
      id = JSON.parse(last_response.body).fetch('id')
      CartoDB::Visualization::Member.new(id: id).fetch
    end

    def visualization_template(user, attributes = {})
      {
        name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
        tags:                     attributes.fetch(:tags, ['foo', 'bar']),
        map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: user.id).id),
        description:              attributes.fetch(:description, 'bogus'),
        type:                     attributes.fetch(:type, 'derived'),
        privacy:                  attributes.fetch(:privacy, 'public'),
        source_visualization_id:  attributes.fetch(:source_visualization_id, nil),
        parent_id:                attributes.fetch(:parent_id, nil),
        locked:                   attributes.fetch(:locked, false),
        prev_id:                  attributes.fetch(:prev_id, nil),
        next_id:                  attributes.fetch(:next_id, nil)
    }
    end
  end
end
