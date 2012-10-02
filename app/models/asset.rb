class Asset < Sequel::Model

  many_to_one :user
  PUBLIC_ATTRIBUTES = %W{ id public_url user_id }

  attr_accessor :asset_file, :file

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?

    begin
      file = (asset_file.is_a?(String) ? File.open(asset_file) : File.open(asset_file.path))
    rescue Errno::ENOENT
      errors.add(:asset_file, "is invalid")
    end

    if file.is_a?(File)
      errors.add(:asset_file, "is invalid") unless File.readable?(file)
      errors.add(:asset_file, "is too big, 10Mb max") unless file.size <= Cartodb::config[:assets]["max_file_size"]
      file.close
    end
  end

  def after_save
    super

    store!(asset_file) unless asset_file.blank?
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
  def store!(file)
    file_path = file.is_a?(String) ? file : file.path
    basename  = file.is_a?(String) ? File.basename(file) : file.original_filename

    # Upload the file
    o = s3_bucket.objects["#{asset_path}#{basename}"]
    o.write(Pathname.new(file_path), {
      acl: :public_read,
      content_type: MIME::Types.type_for(file_path).first.to_s
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
    "user/#{self.user_id}/assets/"
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
