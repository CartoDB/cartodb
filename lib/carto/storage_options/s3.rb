# encoding: utf-8

module Carto
  module StorageOptions
    class S3
      def self.conf
        Cartodb.get_config(:aws, 's3')
      end

      def self.enabled?
        conf.try(:any?) ? true : false
      end

      def initialize(bucket_name)
        @bucket_name = bucket_name

        AWS::config(self.class.conf)
      end

      def upload(namespace, file)
        filename = Pathname.new(file.path).basename.to_s
        mime_type = MIME::Types.type_for(filename).first.to_s
        identifier = File.join(namespace, filename)

        s3_object = bucket.objects[identifier]
        s3_object.write(file: file, content_type: mime_type, acl: :public_read)

        [identifier, s3_object.public_url(secure: true).to_s]
      end

      def remove(path)
        bucket.objects[path].delete
      end

      private

      def bucket
        @bucket ||= AWS::S3.new.buckets[@bucket_name]
      end
    end
  end
end
