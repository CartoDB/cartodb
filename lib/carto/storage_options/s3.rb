# encoding: utf-8

module Carto
  module StorageOptions
    class S3
      def self.conf
        Cartodb.get_config_if_present(:aws, 's3')
      end

      def initialize(bucket_name)
        @bucket_name = bucket_name

        AWS::config(self.class.conf)
      end

      def upload(namespace, file)
        filename = Pathname.new(file.path).basename.to_s
        mime_type = MIME::Types.type_for(filename).first.to_s

        asset = bucket.objects[File.join(namespace, filename)]
        asset.write(file: file, content_type: mime_type)

        asset.url_for(:read)
      end

      def remove(path)
        bucket.objects[path].delete
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
