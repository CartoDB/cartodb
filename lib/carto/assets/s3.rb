# encoding utf-8

class Carto::Storage::S3
  def self.instance_if_enabled
    s3 = Carto::Storage::S3.new
    s3 if s3.config.present?
  end

  def initailize
    AWS::config(config) if config.present
  end

  def config
    @config ||= Cartodb.config.fetch(:aws, 's3')
  end

  def create(namespace, file_path)
    bucket = get_or_create_bucket(namespace)
    asset = bucket.objects['file_path']
    asset.write(file: file_path)

    asset.url_for(:read)
  end

  def delete(namespace, file_path)
    bucket = bucket(namespace)
    return unless bucket

    bucket.delete(file_path)
  end

  private

  def get_or_create_bucket(bucket_name)
    bucket(bucket_name) || s3.buckets.create(bucket_name)
  end

  def bucket(bucket_name)
    s3.new.buckets[bucket_name]
  end

  def s3
    @s3 ||= AWS::S3.new
  end
end
