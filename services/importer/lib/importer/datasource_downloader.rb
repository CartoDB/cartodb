# encoding: utf-8
require 'fileutils'
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './unp'

module CartoDB
  module Importer2
    class DatasourceDownloader

      def initialize(datasource, item_metadata, options={}, logger = nil, repository=nil)
        @checksum = nil

        @datasource     = datasource
        @item_metadata  = item_metadata
        @options = options
        raise UploadError if datasource.nil?

        @logger = logger
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
      end

      def run(available_quota_in_bytes=nil)
        @datasource.logger=@logger unless @logger.nil?

        set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      def clean_up
        if defined?(@temporary_directory) \
           && @temporary_directory =~ /^#{CartoDB::Importer2::Unp::IMPORTER_TMP_SUBFOLDER}/ \
           && !(@temporary_directory =~ /\.\./)
          FileUtils.rm_rf @temporary_directory
        end
      end

      def set_downloaded_source_file(available_quota_in_bytes=nil)
        @checksum = @item_metadata[:checksum]
        return self unless modified?

        stream_data = @datasource.kind_of? CartoDB::Datasources::BaseFileStream

        if stream_data
          self.source_file = SourceFile.new(filepath(@item_metadata[:filename]), @item_metadata[:filename])

          output_stream = File.open(self.source_file.fullpath, 'wb')

          @datasource.stream_resource(@item_metadata[:id], output_stream)

          output_stream.close
        else
          begin
            resource_data = @datasource.get_resource(@item_metadata[:id])
          rescue => exception
            if exception.message =~ /quota/i
              raise StorageQuotaExceededError
            else
              raise
            end
          end
          store_retrieved_data(@item_metadata[:filename], resource_data, available_quota_in_bytes)
        end

        self
      end

      def raise_if_over_storage_quota(size, available_quota_in_bytes=nil)
        return self unless available_quota_in_bytes
        raise StorageQuotaExceededError if size > available_quota_in_bytes.to_i
      end

      def modified?
        previous_checksum = @options.fetch(:checksum, false)
        checksum          = (@checksum.nil? || @checksum.size == 0) ? false : @checksum

        return true unless (previous_checksum)
        return true if previous_checksum && checksum && previous_checksum != checksum
        false
      end

      attr_reader  :source_file

      private
      
      attr_reader :repository
      attr_writer :source_file

      def store_retrieved_data(filename, resource_data, available_quota_in_bytes)
        data = StringIO.new(resource_data)
        name = filename
        raise_if_over_storage_quota(data.size, available_quota_in_bytes)
        self.source_file = SourceFile.new(filepath(name), name)
        repository.store(source_file.path, data)
      end


      def filepath(name)
        repository.fullpath_for(name )
      end

      def temporary_directory
        return @temporary_directory if @temporary_directory
        @temporary_directory = Unp.new.generate_temporary_directory.temporary_directory
      end
    end
  end
end

