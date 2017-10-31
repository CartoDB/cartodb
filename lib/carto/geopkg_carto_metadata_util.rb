require 'sqlite3'
require 'active_support/core_ext/hash/indifferent_access'
require 'json'

module Carto
  class GpkgCartoMetadataUtil

    def initialize(geopkg_file:)
      # Connect to the database
      @db = SQLite3::Database.new(geopkg_file)

      # Find the appropriate carto metadata record
      @orig_metadata = @metadata = carto_metadata
    end

    def self.open(geopkg_file:)
      file = GpkgCartoMetadataUtil.new(geopkg_file: geopkg_file)

      return file unless block_given?

      begin
        yield file
      ensure
        file.close
      end
    end

    # Send in metadata as a hash
    def metadata=(metadata)
      raise ArgumentError unless metadata

      md = metadata.with_indifferent_access

      # Always make sure a carto property exists
      md[:vendor] = 'carto' unless md.key?(:vendor)

      @metadata = md
    end

    # Get metadata as hash
    def metadata
      @metadata ||= { vendor: 'carto' }.with_indifferent_access
    end

    # Commit the changes to the file
    # Ruby - destructor to commit -> call close()
    def close
      if @orig_metadata
        unless @orig_metadata == @metadata
          @db.execute "update gpkg_metadata set metadata=? where metadata=?",
                      @metadata.to_json, @orig_metadata.to_json
        end
      # If the record doesn't exist add a new one...
      elsif @metadata
        @db.execute 'insert into gpkg_metadata ' \
                    '(md_standard_uri, md_scope, mime_type, metadata) ' \
                    'values ( "", "dataset", "text/json", ? )', @metadata.to_json
        @orig_metadata = @metadata
      end
    end

    private

    def carto_metadata
      # Currently there is no key to quickly find the record.
      # Therefore it is assumed that not too many metadata records
      #  exist and a table scan is acceptable for a first implementation
      @db.execute('select metadata from gpkg_metadata') do |row|
        next unless row
        metadata = (JSON.parse(row[0]) || {}).with_indifferent_access
        return metadata if metadata[:vendor] && metadata[:vendor] == 'carto'
      end
      return nil
    rescue JSON::ParserError
    end
  end
end
