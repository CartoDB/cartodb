# encoding: utf-8

module Carto
  module StorageOptions
    class S3
      def self.new_if_available(bucket_name)
        s3 = Carto::StorageOptions::S3.new(bucket_name)
        s3 if s3.config.present? && s3.bucket_name.present?
      end

      attr_reader :bucket_name
      def initailize(bucket_name)
        @bucket_name = bucket_name

        AWS::config(config) if config.present
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
        @config ||= Cartodb.config.fetch(:aws, 's3')
      end

      private

      def bucket
        return @bucket if @bucket

        existing_bucket = s3.buckets[bucket_name]
        @bucket = if existing_bucket
                    existing_bucket
                  else
                    s3.buckets.create(bucket_name)
                  end
      end

      def s3
        @s3 ||= AWS::S3.new
      end
    end
  end
end
