# coding: UTF-8

require 'spec_helper'
require 'models/permissions_shared_examples'

describe Carto::Permission do
  it_behaves_like 'permission models' do
    def permission_from_visualization_id(entity_id)
      visualization_from_id(entity_id).permission
    end

    def visualization_from_id(entity_id)
      Carto::Visualization.find(entity_id)
    end

    def permission_klass
      Carto::Permission
    end

    def user_for_association_from_id(user_id)
      Carto::User.find(user_id)
    end

    def save_permission(permission)
      permission.save!
    end

    def validation_error_klass
      ActiveRecord::RecordInvalid
    end
  end
end
