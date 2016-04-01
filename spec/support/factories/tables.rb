# encoding: UTF-8
require_relative '../../helpers/unique_names_helper'

module CartoDB
  module Factories
    include UniqueNamesHelper

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
        attributes[:name] || unique_name('table')
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
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
      post_json api_v1_visualizations_create_url(user_domain: user.username, api_key: user.api_key), visualization_template(user, attributes) do |response|
        id = response.body[:id]
        CartoDB::Visualization::Member.new(id: id).fetch
      end
    end

    def visualization_template(user, attributes = {})
      {
        name:                     attributes.fetch(:name, unique_name('viz')),
        display_name:             attributes.fetch(:display_name, nil),
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
