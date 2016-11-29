# encoding utf-8

class Carto::Storage::S3
  def self.instance_if_enabled
    s3 = Carto::Storage::S3.new
    s3 if s3.config.present? && s3.bucket_name.present?
  end

  def initailize
    AWS::config(config) if config.present
  end

  def config
    @config ||= Cartodb.config.fetch(:aws, 's3')
  end

  def bucket_name
    @bucket_name ||= Cartodb.config.fetch(:assets, 's3_bucket_name')
  end

  def upload(namespaced_name, file_path)
    asset = bucket.objects[namespaced_name]
    asset.write(file: file_path)

    asset.url_for(:read)
  end

  def remove(namespaced_name)
    bucket.delete(namespaced_name)
  end

  private

  def bucket
    @bucket ||= s3.new.buckets[bucket_name]
  end

  def s3
    @s3 ||= AWS::S3.new
  end
end
