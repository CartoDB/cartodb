# encoding: utf-8
require 'aws-sdk'
require_relative './aws_configurator'

module Workman
  module Commands
    class S3Uploader
      def initialize(config={})
        AWSConfigurator.new(config).configure
        @bucket_name = config.fetch(:bucket_name, ENV['S3_BUCKET'])
      end #initialize

      def upload(filepath)
        basename      = File.basename(filepath)
        uploaded_file = bucket.objects[basename]

        uploaded_file.write(file: filepath)
        uploaded_file.public_url
      end #upload

      private

      attr_reader :bucket_name

      def bucket
        @bucket ||= AWS::S3.new.buckets[bucket_name]
      end #bucket
    end # S3Uploader
  end # Commands
end # Workman

