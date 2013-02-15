# encoding: utf-8
require 'aws-sdk'
require_relative './aws_configurator'

module Workman
  module Commands
    class S3Uploader
      def initialize(config={})
        AWSConfigurator.new(config).configure
      end #initialize

      def upload(filepath, bucket=nil)
        bucket        ||= default_bucket
        basename      = File.basename(filepath)
        uploaded_file = bucket.objects[basename]

        uploaded_file.write(file: filepath)
        uploaded_file.public_url
      end #upload

      private

      attr_reader :bucket_name

      def default_bucket
        @default_bucket ||= AWS::S3.new.buckets[ENV.fetch('S3_BUCKET')]
      end #default_bucket
    end # S3Uploader
  end # Commands
end # Workman

