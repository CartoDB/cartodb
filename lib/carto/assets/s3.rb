# encoding utf-8

class Carto::Storage::S3
  def self.instance_if_enabled
    s3 = Carto::Storage::S3.new

    s3 if s3.enabled?
  end

  def enabled?
    config.present? && bucket_name.present?
  end

  private

  def bucket
    AWS.config(config)
    AWS::S3.new.buckets[bucket_name]
  end

  def config
    Cartodb.config.fetch(:aws, 's3')
  end

  def bucket_name
    Cartodb.config(:assets, 's3_bucket_name')
  end
end
