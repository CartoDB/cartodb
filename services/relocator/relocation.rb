# encoding: utf-8
require 'stringio'
require 'uuidtools'
require_relative './relocator'

module CartoDB
  module Relocator
    class Relocation
      attr_reader :id, :local, :remote

      def initialize(id=nil, local=nil, remote=nil)
        @id     = id     || next_id
        @local  = local  || Relocator.default_local
        @remote = remote || Relocator.default_remote
      end #initialize

      def fetch(file)
        local.fetch(path_for(file))
      end #fetch

      def store(file, data, prefix=nil)
        local.store(path_for(file, prefix), data)
      end #store

      def upload
        remote.store(bundle_path, local.fetch(bundle_path))
      end #upload_to_remote

      def download
        local.store(bundle_path, remote.fetch(url_for(bundle_path)))
      end #download_from_remote

      def zip
        local.zip(id)
      end #zip

      def unzip
        local.unzip("#{id}.zip")
      end #unzip

      def path_for(file, prefix=nil)
        File.join([id, prefix.to_s, file.to_s].compact)
      end #path_for

      def url_for(path)
        bucket = ENV['S3_BUCKET']
        "https://s3.amazonaws.com/#{bucket}/#{path}"
      end #url_for

      def token
        "relocator_#{id.to_s.gsub(/-/, '_')}" 
      end #token

      def bundle_path
        "#{id}.zip"
      end #bundle_path

      private

      def next_id
        UUIDTools::UUID.timestamp_create
      end #next_id
    end # Relocation
  end # Relocator
end # CartoDB

