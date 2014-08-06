# encoding: utf-8

module CartoDB
  module TwitterSearch
    class JSONToCSVConverter

      INDIVIDUAL_FIELDS = [
        :id,
        :verb,
        :link,
        :body,
        :objectType,
        :postedTime,
        :favoritesCount,
        :twitter_filter_level,
        :twitter_lang,
        :retweetCount
      ]

      GROUP_FIELDS = [
        :actor,
        :generator,
        :provider,
        :inReplyTo,
        :geo,
        :twitter_entities,  # Save json string,
        :object,            # Save json string
        :location,
        :gnip
      ]

      # Same as above but with fields inside a group field
      SUBGROUP_FIELDS_TO_DUMP = {
        :actor => [
          :links,     #links[0].href
          :location,  # May be a Twitter Place, with a displayName and objectType, or a simple String
          :languages  #languages[0]
        ],
        :location => [
          :geo,     # Bounding box, careful: http://support.gnip.com/sources/twitter/data_format.html
        ],
        :geo => [
          :coordinates  # Array lat-lon
        ]
      }

      # This fields will get dumped as field_subfield. If not preent here will be saved as a stringified json
      SUBFIELDS = {
        :actor => [
          :objectType,
          :id,
          :link,
          :displayName,
          :image,
          :summary,
          :postedTime,
          :links,
          :location,
          :utcOffset,
          :preferredUsername,
          :languages,
          :twitterTimeZone,
          :friendsCount,
          :followersCount,
          :listedCount,
          :statusesCount,
          :verified
        ],
        :generator => [
          :displayName,
          :link
        ],
        :provider => [
          :objectType,
          :displayName,
          :link
        ],
        :inReplyTo => [
          :link
        ],
        :location => [
          :objectType,
          :displayName,
          :link,
          :geo,
          :streetAddress,
          :name
        ],
        :geo => [
          :type,
          :coordinates
        ]
      }

      def process(input_data)
        results = []

        # Headers
        results_row = INDIVIDUAL_FIELDS.map { |field|
          field_to_csv(field)
        }
        GROUP_FIELDS.each { |field|
          if SUBFIELDS[field].nil?
            results_row << field_to_csv(field)
          else
            SUBFIELDS[field].each { |subfield|
              results_row << field_to_csv("#{field.to_s}_#{subfield.to_s}")
            }
          end
        }
        results << results_row.join(',')

        # TODO: Error checking

        # Data
        input_data.each { |item|
          results_row = []

          INDIVIDUAL_FIELDS.each { |field|
            results_row << (item[field].nil? ? nil : field_to_csv(item[field]))
          }

          GROUP_FIELDS.each { |field|
            # Group field empty? then must be dumped
            if SUBFIELDS[field].nil?
              if !item[field].nil?
                results_row << field_to_csv(::JSON.dump(item[field]))
              else
                results_row << nil
              end
            else
              # Go inside fields
              SUBFIELDS[field].each { |subfield|
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
              }
            end
          }

          results << results_row.join(',')
        }

        results.join("\n")
      end


      private

      def field_to_csv(field)
        '"' + field.to_s.gsub('"', '""') + '"'
      end

    end
  end
end
