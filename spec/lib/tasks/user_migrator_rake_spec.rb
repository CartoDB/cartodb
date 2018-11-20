require 'spec_helper_min'
require 'rake'
require 'factories/carto_visualizations'

describe 'user_migrator.rake' do
  include Carto::Factories::Visualizations

  before(:all) do
    Rake.application.rake_require "tasks/user_migrator"
    Rake::Task.define_task(:environment)
  end

  describe '#cartodb:user_migrator:cleanup:organization' do
    it 'does not remove organization assets from storage' do
      org = FactoryGirl.create(:organization_with_users)
      Asset.create(
        asset_file: (Rails.root + 'spec/support/data/cartofante_blue.png'),
        user: org.owner,
        organization_id: org.id
      )
      Asset.any_instance.stubs(:remove).raises("NOOOO!")
      Rake::Task['cartodb:user_migrator:cleanup:organization'].invoke(org.name)
    end

    it 'does not remove user assets from storage' do
      user = FactoryGirl.create(:valid_user)
      Asset.create(
        asset_file: Rails.root + 'spec/support/data/cartofante_blue.png',
        user: user
      )
      Asset.any_instance.stubs(:remove).raises("NOOOO!")
      Rake::Task['cartodb:user_migrator:cleanup:user'].invoke(user.username)
    end
  end
end
