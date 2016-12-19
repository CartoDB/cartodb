require 'rollbar'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'
require_relative '../../models/visualization/external_source'
require_relative '../../models/common_data/singleton'

module CartoDB

  module Visualization

    class CommonDataService

      def initialize(datasets = nil)
        @datasets = datasets
      end

      def self.load_common_data(user, controller)
        if self.configured?
          common_data_url = CartoDB::Visualization::CommonDataService.build_url(controller)
          user.load_common_data(common_data_url)
        end
      end

      def self.configured?
        !Cartodb.config[:common_data].nil?
      end

      def self.build_url(controller)
        common_data_config = Cartodb.config[:common_data]
        return nil unless common_data_config

        common_data_base_url = common_data_config['base_url']
        common_data_username = common_data_config['username']
        common_data_user = Carto::User.where(username: common_data_username).first
        if !common_data_base_url.nil?
          # We set user_domain to nil to avoid duplication in the url for subdomainfull urls. Ie. user.cartodb.com/u/cartodb/...
          common_data_base_url + CartoDB.path(controller, 'api_v1_visualizations_index', {type: 'table', privacy: 'public', user_domain: nil})
        elsif !common_data_user.nil?
          CartoDB.url(controller, 'api_v1_visualizations_index', {type: 'table', privacy: 'public'}, common_data_user)
        else
          CartoDB.notify_error(
            'cant create common-data url. User doesn\'t exist and base_url is nil',
            username: common_data_username
          )
        end
      end

      def load_common_data_for_user(user, visualizations_api_url)
        update_user_date_flag(user)

        added = 0
        updated = 0
        not_modified = 0
        deleted = 0
        failed = 0

        remotes_by_name = {}
        user_remotes = CartoDB::Visualization::Collection.new.fetch(type: CartoDB::Visualization::Member::TYPE_REMOTE, user_id: user.id)
        user_remotes.each { |r|
          remotes_by_name[r.name] = r
        }
        get_datasets(visualizations_api_url).each do |dataset|
          begin
            visualization = remotes_by_name.delete(dataset['name'])
            if visualization
              if visualization.update_remote_data(
                  Member::PRIVACY_PUBLIC,
                  dataset['description'], dataset['tags'], dataset['license'],
                  dataset['source'], dataset['attributions'], dataset['display_name'], dataset['exportable'], dataset['export_geom'])
                visualization.store
                updated += 1
              else
                not_modified += 1
              end
            else
              visualization = Member.remote_member(
                dataset['name'], user.id, Member::PRIVACY_PUBLIC,
                dataset['description'], dataset['tags'], dataset['license'],
                dataset['source'], dataset['attributions'], dataset['display_name'], dataset['exportable'], dataset['export_geom']).store
              added += 1
            end

            external_source = ExternalSource.where(visualization_id: visualization.id).first
            if external_source
              external_source.save if !(external_source.update_data(dataset['url'], dataset['geometry_types'], dataset['rows'], dataset['size'], 'common-data').changed_columns.empty?)
            else
              ExternalSource.new(visualization.id, dataset['url'], dataset['geometry_types'], dataset['rows'], dataset['size'], 'common-data').save
            end
          rescue => e
            CartoDB.notify_exception(e, {
              name: dataset.fetch('name', 'ERR: name'),
              source: dataset.fetch('source', 'ERR: source'),
              rows: dataset.fetch('rows', 'ERR: rows'),
              updated_at: dataset.fetch('updated_at', 'ERR: updated_at'),
              url: dataset.fetch('url', 'ERR: url')
            })
            failed += 1
          end
        end

        remotes_by_name.each { |name, remote|
          deleted += 1 if delete_remote_visualization(remote)
        }

        return added, updated, not_modified, deleted, failed
      end

      def update_user_date_flag(user)
        begin
          user.last_common_data_update_date = Time.now
          if user.valid?
            user.save(raise_on_failure: true)
          elsif user.errors[:quota_in_bytes]
            # This happens for the organization quota validation in the user model so we bypass this
            user.save(:validate => false, raise_on_failure: true)
          end
        rescue => e
          CartoDB.notify_exception(e, {user: user})
        end
      end

      def delete_common_data_for_user(user)
        #TODO This is ugly, I know, one query per vis but I've tried to use Collection pagination
        #to do it without result. When the Carto::Visualization model could be used to delete this
        #should be move to AR and paginate removing the extra query
        deleted = 0
        vqb = Carto::VisualizationQueryBuilder.new
                                              .with_type(Carto::Visualization::TYPE_REMOTE)
                                              .with_user_id(user.id)
                                              .build

        vis_ids = vqb.pluck(:id)
        vis_ids.each do |vis_id|
          vis = CartoDB::Visualization::Member.new(id: vis_id).fetch
          delete_remote_visualization(vis)
          deleted += 1
        end
        deleted
      end

      private

      def get_datasets(visualizations_api_url)
        @datasets ||= CommonDataSingleton.instance.datasets(visualizations_api_url)
      end

      def delete_remote_visualization(visualization)
        begin
          ExternalSource.where(visualization_id: visualization.id).delete
          visualization.delete
          true
        rescue Sequel::DatabaseError => e
          match = e.message =~ /violates foreign key constraint "external_data_imports_external_source_id_fkey"/
          if match.present? && match >= 0
            # TODO: "mark as deleted" or similar to disable old, imported visualizations
            puts "Couldn't delete #{visualization.id} visualization because it's been imported"
            false
          else
            CartoDB.notify_error(
              "Couldn't delete remote visualization",
              visualization: visualization.id,
              error: e.inspect
            )
            raise e
          end
        end
      end

    end

  end

end
