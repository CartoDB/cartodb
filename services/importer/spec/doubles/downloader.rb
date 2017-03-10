# encoding: utf-8
require_relative '../../lib/importer/source_file'
require 'tempfile'

module CartoDB

  module Datasources
    class DatasourcesFactory

      class << self

        alias_method :old_getdatasource, :get_datasource

        def get_datasource(datasource_name, user, additional_config = {})
          case datasource_name
            when CartoDB::Importer2::Doubles::DatasourceFake::DATASOURCE_NAME
              #{ fake_config: 'fake_config'}
              CartoDB::Importer2::Doubles::DatasourceFake.new
            else
              old_getdatasource(datasource_name, user, additional_config)
          end
        end

      end

    end
  end

  module Importer2


    module Doubles

      class DatasourceFake

        DATASOURCE_NAME = 'FAKE_DATASOURCE'

        def  get_resource_metadata(subresource_id)
          {}
        end

      end

      class MultipleDownloaderFake

        def self.instance(number_of_subresources)
          new(Doubles::DatasourceFake.new, nil, nil, nil, nil, number_of_subresources)
        end


        attr_reader :datasource, :item_metadata, :options, :logger, :repository, :number_of_subresources, :source_file

        def initialize(datasource, item_metadata, options, logger, repository, number_of_subresources = 1)
          @datasource = datasource
          @item_metadata = item_metadata
          @options = options
          @logger = logger
          @repository = repository
          @number_of_subresources = number_of_subresources

          subresources = (1..number_of_subresources).map do |i|
            { :id => i }
          end
          @item_metadata ||= { :subresources => subresources }

          @tempfile = Tempfile.new('downloader_double')
          @source_file = SourceFile.new(@tempfile.path)
        end

        def multi_resource_import_supported?
          true
        end

        def run(available_quota_in_bytes=nil)
          #set_local_source_file || set_downloaded_source_file(available_quota_in_bytes)
          self
        end

        def modified?
          false
        end

        def clean_up

        end

      end

    end
  end
end
