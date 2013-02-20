# encoding: utf-8
require_relative 'aws_configurator'
require_relative 'url_parser'

module DataRepository
  module Filesystem
    module S3
      class Backend
        def initialize(config={})
          AWSConfigurator.new(config).configure
          @connection = AWS::S3.new
        end #initialize

        def store(io_object, path, bucket=nil)
          bucket        ||= default_bucket
          uploaded_file = bucket.objects[path]

          uploaded_file.write(io_object)
          uploaded_file.public_url.to_s
        end #store

        def fetch(file_url, bucket=nil)
          bucket_name, object_name = UrlParser.new(file_url).parse

          bucket ||= bucket_from(bucket_name)
          object_from(bucket, object_name)
        end #fetch

        private

        attr_reader :connection

        def default_bucket
          @default_bucket ||= connection.buckets[ENV.fetch('S3_BUCKET')]
        end #default_bucket

        def bucket_from(bucket_name)
          connection.buckets[bucket_name]
        end #bucket_from

        def object_from(bucket, object_name)
          bucket.objects[object_name]
        end #object_from
      end # Backend
    end # S3
  end # Filesystem
end # DataRepository

