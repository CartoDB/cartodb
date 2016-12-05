# encoding: utf-8

module Carto
  module StorageOptions
    class S3
      def self.new_if_available(bucket_name)
        s3 = Carto::StorageOptions::S3.new(bucket_name)
        s3 if s3.config.present? && s3.buc
      end

      attr_reader :bucket_name
      def initialize(bucket_name)
        @bucket_name = bucket_name

        AWS::config(config) if config.try(:any?)
      end

      def upload(namespaced_name, file)
        filename = Pathname.new(file.path).basename
        asset = bucket.objects[File.join(namespaced_name, filename)]
        asset.write(file: file)

        asset.url_for(:read)
      end

      def remove(namespaced_name)
        bucket.delete(namespaced_name)
      end

      def config
        s3_conf = Cartodb.config.fetch(:aws, 's3')
        @config ||= s3_conf['s3'] if s3_conf
      end

      private

      def bucket
        @bucket ||= s3.buckets[bucket_name]
      end

      def s3
        @s3 ||= AWS::S3.new
      end
    end
  end
end
