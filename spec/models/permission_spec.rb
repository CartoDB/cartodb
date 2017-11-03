# coding: UTF-8

require 'spec_helper'
require 'models/permissions_shared_examples'

describe CartoDB::Permission do
  it_behaves_like 'permission models' do
    def permission_from_visualization_id(entity_id)
      visualization_from_id(entity_id).permission
    end

    def visualization_from_id(entity_id)
      ::Visualization::Member.new(id: entity_id).fetch
    end

    def permission_klass
      ::Permission
    end

    def user_for_association_from_id(user_id)
      ::User[user_id]
    end

    def save_permission(permission)
      permission.save
    end

    def validation_error_klass
      Sequel::ValidationFailed
    end
  end
end
