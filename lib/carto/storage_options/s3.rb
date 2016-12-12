# encoding: utf-8

module Carto
  module StorageOptions
    class S3
      def self.new_if_available(bucket_name)
        s3 = Carto::StorageOptions::S3.new(bucket_name)
        s3 if s3.config.present? && s3.bucket.exists?
      end

      attr_reader :bucket_name

      def initialize(bucket_name)
        @bucket_name = bucket_name

        AWS::config(config) if config.try(:any?)
      end

      def upload(namespace, file)
        filename = Pathname.new(file.path).basename
        mime_type = MIME::Types.type_for(filename).first.to_s

        asset = bucket.objects[File.join(namespace, filename)]
        asset.write(file: file, content_type: mime_type)

        asset.url_for(:read)
      end

      def remove(path)
        bucket.objects[path].delete
      end

      def config
        s3_conf = Cartodb.config.fetch(:aws, 's3')
        @config ||= s3_conf['s3'] if s3_conf
      end

      def bucket
        @bucket ||= s3.buckets[bucket_name]
      end

      private

      def s3
        @s3 ||= AWS::S3.new
      end
    end
  end
end
