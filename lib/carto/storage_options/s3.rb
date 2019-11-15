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

        Aws.config = self.class.conf.symbolize_keys
      end

      def upload(namespace, file)
        filename = Pathname.new(file.path).basename.to_s
        mime_type = MIME::Types.type_for(filename).first.to_s
        identifier = File.join(namespace, filename)

        s3_object = bucket.object(identifier)
        s3_object.upload_file(file.path, acl: 'public-read', content_type: mime_type)

        [identifier, s3_object.public_url(secure: true).to_s]
      end

      def remove(path)
        bucket.object(path).delete
      end

      private

      def bucket
        @bucket ||= Aws::S3::Resource.new.bucket(@bucket_name)
      end
    end
  end
end
