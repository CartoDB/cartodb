# encoding: utf-8

require 'zlib'
require_relative '../../../../track_record/track_record'

module CartoDB
  module Synchronizer
    module FileProviders
      class BaseProvider

        # .csv
        FORMAT_CSV = 'csv'
        # .xls .xlsx
        FORMAT_EXCEL = 'xls'
        # .png
        FORMAT_PNG = 'png'
        # .jpg .jpeg
        FORMAT_JPG = 'jpg'
        # .svg
        FORMAT_SVG = 'svg'
        # .zip
        FORMAT_COMPRESSED = 'zip'

        def get_new
          raise 'To be implemented in child classes'
        end

        def get_auth_url
          raise 'To be implemented in child classes'
        end

        def validate_auth_token(token)
          raise 'To be implemented in child classes'
        end

        def token=(token)
          raise 'To be implemented in child classes'
        end

        def token
          raise 'To be implemented in child classes'
        end

        def get_files_list(formats_filter={})
          raise 'To be implemented in child classes'
        end

        def store_chosen_file(id, sync_type)
          raise 'To be implemented in child classes'
        end

        def file_modified?(id)
          raise 'To be implemented in child classes'
        end

        def download_file(id)
          raise 'To be implemented in child classes'
        end

        def setup_formats_filter(formats_filter=[])
          raise 'To be implemented in child classes'
        end

        private_class_method :new

        attr_reader :formats

      end # Base
    end #FileProviders
  end #Syncronizer
end #CartoDB

