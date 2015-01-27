require_relative '../../app/models/common_data'

namespace :cartodb do

  namespace :remotes do

    desc 'Remove common data remotes'
    task :remove do
      CartoDB::Visualization::Collection.new.fetch({type: 'remote'}).map do |v|
        v.delete
      end
    end

    desc 'Load common data account remotes'
    task :reload => [:environment, :remove] do
      require_relative '../../app/models/visualization/remote_member'

      u = User.where(username: 'development').first

      CommonDataSingleton.instance.datasets[:datasets].each do |d|

        v = CartoDB::Visualization::RemoteMember.new(
          d['name'], u.id, CartoDB::Visualization::Member::PRIVACY_PUBLIC, d['description'], [ 'common-data', d['category'] ])
        v.store

      end

    end

  end

end
