# encoding: utf-8
require 'aws-sdk'
require_relative 'aws_configurator'

module Workman
  module Commands
    class S3UrlParser
      def initialize(url)
        @url = url
      end #initialize

      def parse
        object_name = url.split('/').last
        bucket_name = url.split('/')[-2]
        [bucket_name, object_name]
      end #parse

      private

      attr_reader :url
    end # S3UrlParser

    class S3Downloader
      def initialize(config={})
        AWSConfigurator.new(config).configure
        @s3 = AWS::S3.new
      end #initialize

      def download(file_url, destination_directory)
        @bucket_name, @object_name = S3UrlParser.new(file_url).parse
        destination = filepath_for(file_url, destination_directory) 

        bucket = s3.buckets[bucket_name]
        object = bucket.objects[object_name]

        File.open(destination, 'w') do |file| 
          object.read { |chunk| file.write(chunk) }
        end

        destination
      end #download

      private

      attr_reader :s3, :bucket_name, :object_name

      def filepath_for(file_url, destination_directory)
        File.join(destination_directory, file_url.split('/').last)
      end #filepath_for
    end # S3Downloader
  end # Commands
end # Workman

