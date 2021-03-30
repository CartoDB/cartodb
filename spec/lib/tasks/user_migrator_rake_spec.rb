require 'spec_helper_unit'

describe 'user_migrator.rake' do
  before do
    Rake.application.rake_require "tasks/user_migrator"
    Rake::Task.define_task(:environment)
  end

  describe '#cartodb:user_migrator:cleanup:organization' do
    it 'does not remove organization assets from storage' do
      org = create(:organization_with_users)
      ::Asset.create(
        asset_file: Rails.root.join('spec/support/data/cartofante_blue.png'),
        user: org.owner.sequel_user,
        organization_id: org.id
      )
      ::Asset.any_instance.stubs(:remove).raises("NOOOO!")
      Rake::Task['cartodb:user_migrator:cleanup:organization'].invoke(org.name)
    end

    it 'does not remove user assets from storage' do
      user = create(:valid_user)
      ::Asset.create(
        asset_file: Rails.root.join('spec/support/data/cartofante_blue.png'),
        user: user
      )
      ::Asset.any_instance.stubs(:remove).raises("NOOOO!")
      Rake::Task['cartodb:user_migrator:cleanup:user'].invoke(user.username)
    end
  end
end
