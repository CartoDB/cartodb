require 'open-uri'

class Asset < Sequel::Model

  many_to_one :user
  PUBLIC_ATTRIBUTES = %W{ id public_url user_id }

  attr_accessor :asset_file, :url

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  ##
  # Tries to open the specified file object or full path
  #
  def open_file(file_handle)
    file_handle = (file_handle.respond_to?(:path) ? file_handle.path : file_handle.to_s)
    File.open(file_handle)
  rescue Errno::ENOENT
    nil
  end

  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?
    if asset_file.present?
      begin
        @file = open_file(asset_file)
        errors.add(:file, "is invalid") unless @file.is_a?(File) && File.readable?(@file)
        errors.add(:file, "is too big, 10Mb max") if @file.is_a?(File) && @file.size > Cartodb::config[:assets]["max_file_size"]
        store! if errors.blank?
      rescue => e
        errors.add(:file, "error uploading #{e.message}")
      end
    end
  end

  def after_destroy
    super

    remove! unless self.public_url.blank?
  end

  ##
  # Uploads the file and sets public_url attribute
  # to the url of the remote S3 object
  #
  # === Parameters
  #
  # [file_path (String)] full path of the file to upload
  #
  def store!
    # Upload the file
    o = s3_bucket.objects["#{asset_path}#{File.basename(@file)}"]
    o.write(Pathname.new(@file.path), {
      acl: :public_read,
      content_type: MIME::Types.type_for(@file.path).first.to_s
    })

    # Set the public_url attribute
    remote_url = o.public_url.to_s
    self.set(public_url: remote_url)
    self.this.update(public_url: remote_url)
  end

  ##
  # Removes the remote file
  #
  def remove!
    basename = File.basename(public_url)
    o = s3_bucket.objects["#{asset_path}#{basename}"]
    o.delete
  end

  ##
  # Path to the file, relative to the storage system
  #
  def asset_path
    "#{Rails.env}/#{self.user.username}/assets/"
  end


  def s3_bucket_name
    Cartodb.config[:assets]["s3_bucket_name"]
  end

  def s3_bucket
    AWS.config(Cartodb.config[:aws]["s3"])
    s3 = AWS::S3.new

    @s3_bucket ||= s3.buckets[s3_bucket_name]
  end
end
