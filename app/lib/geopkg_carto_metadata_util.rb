require 'sqlite3'
require 'active_support/core_ext/hash/indifferent_access'
require 'json'

class GpkgCartoMetadataUtil

  def initialize(geopkg_file:)
    # Connect to the database
    @db = SQLite3::Database.new geopkg_file

    # Find the appropriate carto metadata record
    @orig_metadata = @metadata = carto_metadata
  end

  def self.open(geopkg_file:)
    f = GpkgCartoMetadataUtil.new(geopkg_file: geopkg_file)

    return f unless block_given?

    begin
      yield f
    ensure
      f.close
    end
  end

  # Send in metadata as a hash
  def metadata=(metadata)
    raise ArgumentError if metadata == nil

    md = metadata.with_indifferent_access

    # Always make sure a carto property exists
    if !md.key?(:vendor)
      md[:vendor] = 'carto'
    end

    @metadata = md
  end

  # Get metadata as hash
  def metadata
    unless @metadata
      @metadata = { vendor: 'carto' }.with_indifferent_access
    end
    @metadata
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
    rec = nil
    @db.execute('select metadata from gpkg_metadata') do |row|
      # Validate the row is correct
      md = JSON.parse(row[0]).with_indifferent_access
      if md.key?(:vendor) && md[:vendor] == 'carto'
        rec = md
      end
    end
    rec
  end
end
