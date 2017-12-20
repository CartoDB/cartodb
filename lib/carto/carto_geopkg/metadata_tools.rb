# encoding: utf-8

module Carto
  module CartoGeoPKG
    module MetadataTools
      class HashGenerator
        def source_for_visualization(visualization)
          synchronization = visualization.synchronization
          return unless synchronization

          {
            type: 'sync',
            configuration: {
              url: synchronization.url,
              refresh_interval_in_seconds: synchronization.interval
            }
          }
        end

        def schema_for_table_schema(table_schema)
          simplified_schema = table_schema.map { |c| [c.first, type: c.last] }

          Hash[*simplified_schema.flatten]
        end
      end

      def visualization_to_json(visualization, version: '0.0.1')
        hash_gen = HashGenerator.new

        {
          information: {
            vendor: 'carto',
            version: version,
            name: visualization.display_name || visualization.name,
            description: visualization.description,
            attributions: visualization.attributions,
            created_at: Time.now.to_i,
            classification: {
              tags: visualization.tags || []
            }
          },
          data: {
            source: hash_gen.source_for_visualization(visualization)
          },
          schema: hash_gen.schema_for_table_schema(
            visualization.user_table.service.schema(cartodb_types: false)
          ),
          publishing: {
            privacy: visualization.privacy
          }
        }
      end
    end
  end
end
