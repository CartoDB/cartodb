require 'rollbar'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'
require_relative '../../models/visualization/external_source'
require_relative '../../models/common_data'

module CartoDB

  module Visualization

    class CommonDataService

      def initialize(datasets = CommonDataSingleton.instance.datasets[:datasets])
        @datasets = datasets
      end

      def load_common_data_for_user(user)
        added = 0
        updated = 0
        not_modified = 0
        failed = 0

        Rollbar.report_message('common data', 'debug', {
          :action => 'load',
          :user_id => user.id,
          :username => user.username
        })
        remotes_by_name = {}
        Member.user_remotes(user.id).each { |r|
          remotes_by_name[r.name] = r
        }
        @datasets.each do |d|
          begin
            visualization = remotes_by_name[d['name']]
            if visualization
              if visualization.update_remote_data(
                  Member::PRIVACY_PUBLIC,
                  d['description'], [ d['category'] ], d['license'],
                  d['source'])
                visualization.store
                updated += 1
              else
                not_modified += 1
              end
            else
              visualization = Member.remote_member(
                d['name'], user.id, Member::PRIVACY_PUBLIC,
                d['description'], [ d['category'] ], d['license'],
                d['source']).store
              added += 1
            end

            external_source = ExternalSource.where(visualization_id: visualization.id).first
            if external_source
              external_source.save if !(external_source.update_data(d['url'], d['geometry_types'], d['rows'], d['size'], 'common-data').changed_columns.empty?)
            else
              ExternalSource.new(visualization.id, d['url'], d['geometry_types'], d['rows'], d['size'], 'common-data').save
            end
          rescue => e
            Rollbar.report_exception(e)
            failed += 1
          end
        end

        return added, updated, not_modified, failed
      end

      def delete_common_data_for_user(user)
        Collection.new.fetch({type: 'remote', user_id: user.id}).map do |v|
          begin
            ExternalSource.where(visualization_id: v.id).delete
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

      private

    end

  end

end
