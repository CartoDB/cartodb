require_relative '../../app/models/common_data'

namespace :cartodb do

  namespace :remotes do

    desc 'Remove common data remotes. Pass username as first argument'
    task :remove do |t, args|
      username = args[:arg1]
      raise 'username required' unless username.present?

      u = User.where(username: username).first

      CartoDB::Visualization::Collection.new.fetch({type: 'remote', user_id: u.id}).map do |v|
        ExternalSource.where(visualization_id: v.id).delete
        v.delete
      end
    end

    desc 'Load common data account remotes. Pass username as first argument. Example: `rake cartodb:remotes:reload[development]`'
    task :reload, [:arg1] => [:environment, :remove] do |t, args|
      username = args[:arg1]
      raise 'username required' unless username.present?

      require_relative '../../app/models/visualization/remote_member'

      u = User.where(username: username).first

      CommonDataSingleton.instance.datasets[:datasets].each do |d|
        v = CartoDB::Visualization::RemoteMember.new(
          d['name'],
          u.id,
          CartoDB::Visualization::Member::PRIVACY_PUBLIC,
          d['description'],
          [ 'common-data', d['category'] ],
          d['license'],
          d['source'])
        v.store

        ExternalSource.new(v.id, d['url']).save

      end

    end

  end

end
