# encoding: utf-8
require_relative './exceptions'
require_relative './source_file'
require_relative '../../../data-repository/filesystem/local'
require_relative './unp'

module CartoDB
  module Importer2
    class DatasourceDownloader

      def initialize(datasource, item_metadata, repository=nil)
        @datasource     = datasource
        @item_metadata  = item_metadata
        raise UploadError if datasource.nil?

        @repository   = repository || DataRepository::Filesystem::Local.new(temporary_directory)
      end #initialize

      def run(available_quota_in_bytes=nil)
        set_downloaded_source_file(available_quota_in_bytes)
        self
      end

      def set_downloaded_source_file(available_quota_in_bytes=nil)

        #TODO: Don't download if not changed
        resource_data = @datasource.get_resource(@item_metadata[:id])

        data = StringIO.new(resource_data)
        name = @item_metadata[:filename]

        raise_if_over_storage_quota(data.size, available_quota_in_bytes)

        self.source_file = SourceFile.new(filepath(name), name)

        repository.store(source_file.path, data)
        self
      end

      def raise_if_over_storage_quota(size, available_quota_in_bytes=nil)
        return self unless available_quota_in_bytes
        raise StorageQuotaExceededError if size > available_quota_in_bytes.to_i
      end

      def modified?
        # TODO: Implement
        true
      end

      attr_reader  :source_file

      private
      
      attr_reader :repository
      attr_writer :source_file

      def filepath(name)
        repository.fullpath_for(name )
      end #filepath

      def temporary_directory
        return @temporary_directory if @temporary_directory
        @temporary_directory = Unp.new.generate_temporary_directory.temporary_directory
      end #temporary_directory
    end # Downloader
  end # Importer2
end # CartoDB

