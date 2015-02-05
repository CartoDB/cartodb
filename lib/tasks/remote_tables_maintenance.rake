require_relative '../../app/models/common_data'

namespace :cartodb do

  namespace :remotes do

    desc 'Remove common data remotes. Pass username as first argument'
    task :remove do |t, args|
      username = args[:arg1]
      raise 'username required' unless username.present?

      u = User.where(username: username).first

      require_relative '../../app/models/visualization/external_source'

      CartoDB::Visualization::Collection.new.fetch({type: 'remote', user_id: u.id}).map do |v|
        begin
          CartoDB::Visualization::ExternalSource.where(visualization_id: v.id).delete
          v.delete
        rescue Sequel::DatabaseError => e
          match = e.message =~ /violates foreign key constraint "external_data_imports_external_source_id_fkey"/
          if match.present? && match >= 0
            puts "Couldn't delete #{v.id} visualization because it's been imported"
          else
            raise e
          end
        end
      end
    end

    desc 'Load common data account remotes. Pass username as first argument. Example: `rake cartodb:remotes:reload[development]`'
    task :reload, [:arg1] => [:environment, :remove] do |t, args|
      username = args[:arg1]
      raise 'username required' unless username.present?

      require_relative '../../app/models/visualization/remote_member'
      require_relative '../../app/models/visualization/external_source'

      u = User.where(username: username).first

      CommonDataSingleton.instance.datasets[:datasets].each do |d|
        v = CartoDB::Visualization::RemoteMember.new(
          d['name'],
          u.id,
          CartoDB::Visualization::Member::PRIVACY_PUBLIC,
          d['description'],
          [ d['category'] ],
          d['license'],
          d['source'])
        v.store

        # TODO: retrieve geometry_types
        external_source = CartoDB::Visualization::ExternalSource.new(v.id, d['url'], '{}', d['rows'], d['size'], 'common-data')
        external_source.save

      end

    end

  end

end
