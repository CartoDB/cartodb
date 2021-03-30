require_relative '../spec_helper'
require_relative 'user_shared_examples'
require 'helpers/user_part_helper'

describe 'refactored behaviour' do
  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:organization_user_1) { organization.owner.sequel_user }
  let(:organization_user_2) do
    create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true }).sequel_user
  end

  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).get_twitter_imports_count
    end

    def get_user_by_id(user_id)
      ::User.where(id: user_id).first
    end

    def create_user
      create(:valid_user)
    end

    def build_user
      build(:valid_user)
    end
  end
end
