require 'rollbar'
require_relative '../../models/carto/visualization'
require_relative '../../models/common_data/singleton'

module CartoDB

  module Visualization

    class CommonDataService

      include ::LoggerHelper
      extend ::LoggerHelper

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
        Cartodb.get_config(:common_data, 'base_url').present?
      end

      def self.build_url(controller)
        common_data_config = Cartodb.config[:common_data]
        return nil unless common_data_config

        common_data_base_url = common_data_config['base_url']
        common_data_username = common_data_config['username']
        common_data_user = Carto::User.where(username: common_data_username).first
        if common_data_base_url.present?
          Rails.application.routes.url_helpers.api_v1_visualizations_index_url(
            type: 'table',
            privacy: 'public',
            host: common_data_base_url
          )
        elsif common_data_user.present?
          Rails.application.routes.url_helpers.api_v1_visualizations_index_url(
            type: 'table',
            privacy: 'public',
            host: CartoDB.base_url_from_user(common_data_user)
          )
        else
          log_error(
            message: "Can't create common-data url. User doesn't exist and base_url is nil",
            username: common_data_username
          )
        end
      end

      def load_common_data_for_user(user, visualizations_api_url)
        update_user_date_flag(user)

        datasets = begin
                     get_datasets(visualizations_api_url)
                   rescue StandardError => e
                     log_error(message: "Loading common data failed", exception: e, target_user: user)
                     nil
                   end
        # As deletion would delete all user syncs, if the endpoint fails or return nothing, just do nothing.
        # The user date flag is updated to avoid DDoS-ing.
        return nil unless datasets.present?

        added = 0
        updated = 0
        not_modified = 0
        deleted = 0
        failed = 0

        carto_user = Carto::User.find(user.id)

        common_data_config = Cartodb.config[:common_data]
        common_data_username = common_data_config['username']
        common_data_remotes_by_name = Carto::Visualization.remotes
                                                          .where(user_id: user.id)
                                                          .joins(:external_source)
                                                          .readonly(false) # joins causes readonly
                                                          .where(external_sources: { username: common_data_username })
                                                          .map { |v| [v.name, v] }.to_h
        ActiveRecord::Base.transaction do
          datasets.each do |dataset|
            begin
              visualization = common_data_remotes_by_name.delete(dataset['name'])
              if visualization
                visualization.attributes = dataset_visualization_attributes(dataset)
                if visualization.changed?
                  visualization.save!
                  updated += 1
                else
                  not_modified += 1
                end
              else
                visualization = Carto::Visualization.new(
                  dataset_visualization_attributes(dataset).merge(
                    name: dataset['name'],
                    user: carto_user,
                    type: Carto::Visualization::TYPE_REMOTE
                  )
                )
                visualization.save!
                added += 1
              end

              external_source = Carto::ExternalSource.find_by(visualization_id: visualization.id)
              if external_source
                if external_source.update_data(
                  dataset['url'],
                  dataset['geometry_types'],
                  dataset['rows'],
                  dataset['size'],
                  'common-data'
                ).changed?
                  external_source.save!
                end
              else
                Carto::ExternalSource.create(
                  visualization_id: visualization.id,
                  import_url: dataset['url'],
                  rows_counted: dataset['rows'],
                  size: dataset['size'],
                  geometry_types: dataset['geometry_types'],
                  username: 'common-data'
                )
              end
            rescue StandardError => e
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
        end

        common_data_remotes_by_name.each_value do |remote|
          deleted += 1 if delete_remote_visualization(remote)
        end

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
        rescue StandardError => e
          CartoDB.notify_exception(e, {user: user})
        end
      end

      def delete_common_data_for_user(user)
        deleted = 0
        vqb = Carto::VisualizationQueryBuilder.new
        vqb.with_type(Carto::Visualization::TYPE_REMOTE).with_user_id(user.id).build.each do |v|
          delete_remote_visualization(v)
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
          visualization.destroy
          true
        rescue StandardError => e
          match = e.message =~ /violates foreign key constraint "external_data_imports_external_source_id_fkey"/
          if match&.positive?
            # After #13667 this should no longer happen: deleting remote visualizations is propagated, and external
            # sources, external data imports and syncs are deleted
            log_error(message: "Couldn't delete, already imported", visualization: { id: visualization.id })
            false
          else
            Rails.logger.error(
              message: "Couldn't delete remote visualization",
              visualization_id: visualization.id,
              exception: e
            )
          end
        end
      end

      def dataset_visualization_attributes(dataset)
        {
          privacy: Carto::Visualization::PRIVACY_PUBLIC,
          description: dataset['description'],
          tags: dataset['tags'],
          license: dataset['license'],
          source: dataset['source'],
          attributions: dataset['attributions'],
          display_name: dataset['display_name']
        }
      end

    end

  end

end
