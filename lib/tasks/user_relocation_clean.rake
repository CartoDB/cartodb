# encoding: utf-8

namespace :user do
  namespace :relocation do
    desc 'Clean left-over data from a failed relocation load attempt'
    task :clean, [:username] => [:environment] do |task, args|
      user = User.where(username: args[:username]).first
      user.tables.destroy
      user.maps_dataset.destroy
      user.layers_dataset.destroy
      user.assets_dataset.destroy
      user.data_imports_dataset.destroy
      user.client_application.destroy
      user.destroy
    end # load
  end # relocate
end # user

