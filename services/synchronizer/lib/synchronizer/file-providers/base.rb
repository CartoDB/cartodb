# encoding: utf-8

require_relative '../../../../track_record/track_record'

module CartoDB
  module Synchronizer
    module FileProviders
      class BaseProvider

        FORMAT_CSV = 'csv'
        FORMAT_EXCEL = 'xls'
        FORMAT_COMPRESSED = 'zip'
        FORMAT_PNG = 'png'
        FORMAT_JPG = 'jpg'
        FORMAT_SVG = 'svg'

        SUPPORTED_FORMATS = {
            FORMAT_CSV => %W( csv ),
            FORMAT_EXCEL => %W( xls xlsx ),
            FORMAT_COMPRESSED => %W( zip gz tgz tar.gz bz2 tar kmz ),
            FORMAT_PNG => %W( png ),
            FORMAT_JPG => %W( jpg jpeg ),
            FORMAT_SVG => %W( svg )
        }

        def get_new
          raise 'To be implemented in child classes'
        end

        def get_auth_url
          raise 'To be implemented in child classes'
        end

        def validate_auth_token(token)
          raise 'To be implemented in child classes'
        end

        def get_files_list(formats_filter={})
          # [ 'service', 'id', 'title' ]
          raise 'To be implemented in child classes'
        end

        def store_chosen_files(id, service, sync_type)
          raise 'To be implemented in child classes'
        end

        def download_file(service, id)
          raise 'To be implemented in child classes'
        end

        private_class_method :new

      end # Base
    end #FileProviders
  end #Syncronizer
end #CartoDB

