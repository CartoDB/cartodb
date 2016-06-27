# encoding: utf-8
require 'fileutils'
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './unp'

module CartoDB
  module Importer2
    class DatasourceDownloader

      def initialize(datasource, item_metadata, options = {}, logger = nil, repository = nil)
        @checksum = nil
        @source_file = nil
        @datasource = datasource
        @item_metadata = item_metadata
        @options = options
        @importer_config = options[:importer_config]
        raise UploadError if datasource.nil?

        @http_response_code = nil
        @logger = logger
        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
      end

      def provides_stream?
        @datasource.kind_of? CartoDB::Datasources::BaseDirectStream
      end

      def http_download?
        @datasource.providers_download_url?
      end

      def run(available_quota_in_bytes=nil)
        @datasource.logger=@logger unless @logger.nil?
        set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      # Assumes only will be called for streaming
      # @return Boolean if retrieved data or has finished
      def continue_run(available_quota_in_bytes=nil)
        stream_data = @datasource.stream_resource(@item_metadata[:id])
        if stream_data.nil?
          false
        else
          store_retrieved_data(@item_metadata[:filename], stream_data, available_quota_in_bytes)
          true
        end
      end

      def clean_up
        if defined?(@temporary_directory) \
           && @temporary_directory =~ /^#{Unp.new(@importer_config).get_temporal_subfolder_path}/ \
           && !(@temporary_directory =~ /\.\./)
          FileUtils.rm_rf @temporary_directory
        end
      end

      def modified?
        previous_checksum = @options.fetch(:checksum, false)
        previous_checksum = false if previous_checksum == ''  # If comes empty from DB, make pure false
        checksum          = (@checksum.nil? || @checksum.size == 0) ? false : @checksum

        return true unless (previous_checksum)
        return true if previous_checksum && checksum && previous_checksum != checksum
        false
      end

      def multi_resource_import_supported?
        @datasource.multi_resource_import_supported?(@item_metadata[:id])
      end

      attr_reader  :source_file, :item_metadata, :datasource, :options, :logger, :repository, :etag, :checksum, :last_modified

      private

      attr_writer :source_file

      # In the case of DirectStream datasources, this will store a sample to trigger DB creation.
      # In other cases full contents will be stored.
      def set_downloaded_source_file(available_quota_in_bytes=nil)
        @checksum = @item_metadata[:checksum]
        return self unless modified?

        stream_to_file = @datasource.kind_of? CartoDB::Datasources::BaseFileStream
        direct_stream  = @datasource.kind_of? CartoDB::Datasources::BaseDirectStream

        # a) Streaming to DB
        if direct_stream
          initial_stream_data = @datasource.initial_stream(@item_metadata[:id])
          store_retrieved_data(@item_metadata[:filename], initial_stream_data, available_quota_in_bytes)
        end

        # b) Streaming, but into an intermediate file
        if stream_to_file
          self.source_file = SourceFile.new(filepath(@item_metadata[:filename]), @item_metadata[:filename])
          output_stream = File.open(self.source_file.fullpath, 'wb')
          @datasource.stream_resource(@item_metadata[:id], output_stream)
          output_stream.close
        end

        # c) Classic http download to file
        if !stream_to_file && !direct_stream
          begin
            resource_data = @datasource.get_resource(@item_metadata[:id])
            @http_response_code = @datasource.get_http_response_code if @datasource.providers_download_url?
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

      def store_retrieved_data(filename, resource_data, available_quota_in_bytes)
        # Skip storing if no data came in
        return if resource_data.empty?

        data = StringIO.new(resource_data)
        name = filename
        raise_if_over_storage_quota(data.size, available_quota_in_bytes)
        self.source_file = SourceFile.new(filepath(name), name)
        # Delete if exists
        repository.remove(source_file.path) if repository.respond_to?(:remove)
        repository.store(source_file.path, data)
      end


      def filepath(name)
        repository.fullpath_for(name)
      end

      def temporary_directory
        return @temporary_directory if @temporary_directory
        @temporary_directory = Unp.new(@importer_config).generate_temporary_directory.temporary_directory
      end
    end
  end
end

