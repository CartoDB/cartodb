require 'active_record'
    
class GpkgMetadata < ActiveRecord::Base
  # TODO - Add validations of always in json?
  validates :mime_type, inclusion: { in: %w(text/json) }
  validates :metadata, presence: true
end

# Modeled as an ActiveRecord Model
#class GpkgCartoMetadataUtil [X]
 # Generic
 # Nice to have - generate empty gpkg file
 # TODO - Create new issue for geopkg library under cartodb org
 # TODO - Change from active record to core sqlite3 library for use in ruby library outside of rails....
class GpkgCartoMetadataUtil
 CARTO_URI = 'cartodb.com'
      
  def initialize(geopkg_file:)
    # Connect to the database
     ActiveRecord::Base.establish_connection(
       adapter: 'sqlite3',
       database: geopkg_file
     )

     @rec = carto_metadata
  end

  def metadata=(metadata)
    raise ArgumentError if metadata == nil

     @rec.metadata = metadata.to_json
  end

   def metadata
     JSON.load(@rec.metadata).with_indifferent_access
   end

   # Commit the changes to the file
   def commit
     @rec.save
   end

   private
     def carto_metadata
       rec = GpkgMetadata.find_by_md_standard_uri(CARTO_URI)
       if rec == nil
         rec = GpkgMetadata.new(
                md_standard_uri: CARTO_URI,
                md_scope: 'dataset',
                mime_type: 'text/json',
                metadata: {}.to_json )
      end
      rec
    end
end
