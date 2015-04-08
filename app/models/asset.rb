require 'open-uri'
require_relative '../../lib/cartodb/image_metadata.rb'
class Asset < Sequel::Model

  many_to_one :user

  KIND_ORG_AVATAR = 'orgavatar'

  PUBLIC_ATTRIBUTES = %W{ id public_url user_id kind }

  attr_accessor :asset_file, :url

 def before_create
  store
  super
 end

  def after_destroy
    super
    remove unless self.public_url.blank?
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  def validate
    super
    errors.add(:user_id, "can't be blank") if user_id.blank?

    download_file if url.present?
    validate_file if asset_file.present?
  end

  def download_file
    dir = Dir.mktmpdir
    stdout, stderr, status = Open3.capture3('wget', '-nv', '-P', dir, '-E', url)
    self.asset_file = Dir[File.join(dir, '*')][0]
    errors.add(:url, "is invalid") unless status.exitstatus == 0
  end

  def validate_file
    @file = open_file(asset_file)
    errors.add(:file, "is invalid") unless @file && File.readable?(@file.path)
    errors.add(:file, "is too big, 5Mb max") if @file && @file.size > Cartodb::config[:assets]["max_file_size"]
    metadata = CartoDB::ImageMetadata.new(@file.path)
    errors.add(:file, "is too big, 1024x1024 max") if metadata.width > 1024 || metadata.height > 1024
  rescue => e
    errors.add(:file, "error while uploading: #{e.message}")
  end

  ##
  # Tries to open the specified file object or full path
  #
  def open_file(handle)
    (handle.respond_to?(:path) ? handle : File.open(handle.to_s))
  rescue Errno::ENOENT
    nil
  end

  def store
    return unless @file
    filename = (@file.respond_to?(:original_filename) ? @file.original_filename : File.basename(@file))
    filename = "#{Time.now.strftime("%Y%m%d%H%M%S")}#{filename}"

    remote_url = (use_s3? ? save_to_s3(filename) : save_local(filename))
    self.set(public_url: remote_url)
    self.this.update(public_url: remote_url)
  end

  def save_to_s3(filename)
    o = s3_bucket.objects["#{target_asset_path}#{filename}"]
    o.write(Pathname.new(@file.path), {
      acl: :public_read,
      content_type: MIME::Types.type_for(filename).first.to_s
    })
    o.public_url.to_s
  end

  def save_local(filename)
    local_path = Rails.root.join 'public', 'uploads', target_asset_path
    FileUtils.mkdir_p local_path
    FileUtils.cp @file.path, local_path.join(filename)
    p = File.join('/', 'uploads', target_asset_path, filename)
    "http://#{CartoDB.account_host}#{p}"
  end

  def use_s3?
    Cartodb.config[:assets]["s3_bucket_name"].present? &&
    Cartodb.config[:aws]["s3"].present?
  end

  def remove
    unless use_s3?
      local_url = public_url.gsub(/http:\/\/#{CartoDB.account_host}/,'')
      FileUtils.rm("#{Rails.root}/public#{local_url}") rescue ''
      return
    end
    basename = File.basename(public_url)
    o = s3_bucket.objects["#{target_asset_path}#{basename}"]
    o.delete
  end

  def target_asset_path
    "#{Rails.env}/#{self.user.username}/assets/"
  end

  def s3_bucket
    AWS.config(Cartodb.config[:aws]["s3"])
    s3 = AWS::S3.new
    bucket_name = Cartodb.config[:assets]["s3_bucket_name"]
    @s3_bucket ||= s3.buckets[bucket_name]
  end
end
