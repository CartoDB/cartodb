# encoding: utf-8

module CartoDB
  module TwitterSearch
    class JSONToCSVConverter

      INDIVIDUAL_FIELDS = [
        :link,
        :body,
        :objectType,
        :postedTime,
        :favoritesCount,
        :twitter_lang,
        :retweetCount
      ]

      GROUP_FIELDS = [
        :actor,
        :inReplyTo,
        :geo,
        :twitter_entities, # Save json string,
        :location
      ]

      # Same as above but with fields inside a group field
      SUBGROUP_FIELDS_TO_DUMP = {
        actor: [
          :links,     # links[0].href
          :location,  # May be a Twitter Place, with a displayName and objectType, or a simple String
          :languages  # languages[0]
        ],
        # if this gets renamed to the_geom, cartodb will import it as a bounding box
        location: [
          :geo
        ],
        # same as location->geo, but as a point, so should have higher priority
      }

      # This fields will get dumped as field_subfield. If not present here will be saved as a stringified json
      SUBFIELDS = {
        actor: [
          :id,
          :displayName,
          :image,
          :summary,
          :postedTime,
          :location,
          :utcOffset,
          :preferredUsername,
          :friendsCount,
          :followersCount,
          :listedCount,
          :statusesCount,
          :verified
        ],
        inReplyTo: [
          :link
        ],
        location: [
          :geo,
          :name
        ]
      }

      # Other fields with special behaviour we want to add
      CARTODB_FIELDS = [
        :the_geom
      ]

      def generate_headers(additional_fields = {})
        process([], true, additional_fields)
      end

      # Note: 'the_geom' will be added automatically, no need to add as additional field
      def process(input_data, add_headers = true, additional_fields = {})
        results = []

        if add_headers
          results_row = INDIVIDUAL_FIELDS.map { |field|
            field_to_csv(field)
          }

          GROUP_FIELDS.each do |field|
            if SUBFIELDS[field].nil?
              results_row << field_to_csv(field)
            else
              SUBFIELDS[field].each do |subfield|
                results_row << field_to_csv("#{field.to_s}_#{subfield.to_s}")
              end
            end
          end

          CARTODB_FIELDS.each do |field|
            results_row << field_to_csv(field)
          end

          additional_fields.each do |key, _value|
            results_row << field_to_csv(key)
          end

          results << results_row.join(',')
        end

        # Data rows
        input_data.each do |item|
          results_row = []

          INDIVIDUAL_FIELDS.each do |field|
            results_row << (item[field].nil? ? nil : field_to_csv(item[field]))
          end

          GROUP_FIELDS.each do |field|
            # Group field has no subfields "defined"? then must be dumped
            if SUBFIELDS[field].nil?
              if !item[field].nil?
                results_row << field_to_csv(::JSON.dump(item[field]))
              else
                results_row << nil
              end
            else
              # Go inside fields, repeat similar logic
              SUBFIELDS[field].each do |subfield|
                if !item[field].nil? && !item[field][subfield].nil?
                  # Subitems will either get written as they are or dumped
                  if !SUBGROUP_FIELDS_TO_DUMP[field].nil? && SUBGROUP_FIELDS_TO_DUMP[field].include?(subfield)
                    results_row << field_to_csv(::JSON.dump(item[field][subfield]))
                  else
                    results_row << field_to_csv(item[field][subfield])
                  end
                else
                  results_row << nil
                end
              end
            end
          end

          CARTODB_FIELDS.each do |field|
            if field == :the_geom
              results_row << field_to_csv(calculate_the_geom(item))
            end
          end

          additional_fields.each do |_key, value|
            results_row << field_to_csv(value)
          end

          results << results_row.join(',')
        end

        results.join("\n")
      end

      # INFO: This gets called before field-by-field parsing to speed up things
      def clean_string(contents)
        contents.gsub("\\n", ' ').gsub("\\r", ' ')
      end

      private

      def field_to_csv(field)
        # RFC4180
        '"' + field.to_s.gsub('"', '""').gsub("\\", ' ').gsub("\x0D", ' ').gsub("\x0A", ' ').gsub("\0", '') + '"'
      end

      def calculate_the_geom(row)
        output = nil

        # Point
        if !row[:geo].nil? && !row[:geo].empty?
          # Twitter/Gnip bug: They give GeoJSON-like with (lat,lon) point, so transform to proper GeoJSON (lon,lat)
          # Only happens here, location geo is fine, bounding boxes are fine, geo-enrichment is fine too
          lat = row[:geo][:coordinates][0]
          row[:geo][:coordinates][0] = row[:geo][:coordinates][1]
          row[:geo][:coordinates][1] = lat
          output = ::JSON.dump(row[:geo])
        # Geo-enrichment
        elsif !row[:gnip].nil? && !row[:gnip].empty? && !row[:gnip][:profileLocations].nil? &&
              !row[:gnip][:profileLocations].empty?

          row[:gnip][:profileLocations].each do |location|
            # Store first point found (only)
            if !location[:geo].nil? && !location[:geo].empty? && !location[:geo][:type].nil? &&
               !location[:geo][:type].empty? && location[:geo][:type] == 'point' && output.nil?

              output = ::JSON.dump(location[:geo])
            end
          end
        end

        output
      end
    end
  end
end
