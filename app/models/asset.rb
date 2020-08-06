require 'open-uri'
require_relative '../../lib/cartodb/image_metadata.rb'
require_relative '../helpers/file_upload'
require_dependency 'carto/configuration'

class Asset < Sequel::Model
  include Carto::Configuration

  many_to_one :user

  KIND_ORG_AVATAR = 'orgavatar'

  VALID_EXTENSIONS = %w{ .jpeg .jpg .gif .png .svg }

  attr_accessor :asset_file, :url

 def before_create
  store
  super
 end

  def after_destroy
    super
    remove unless self.public_url.blank?
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

  def max_size
    Cartodb::config[:assets]["max_file_size"]
  end

  def validate_file
    extension = asset_file_extension
    unless VALID_EXTENSIONS.include?(extension)
      errors.add(:file, "has invalid format")
      return
    end

    @file = open_file(asset_file)
    unless @file && File.readable?(@file.path)
      errors.add(:file, "is invalid")
      return
    end

    max_size_in_mb = (max_size.to_f / (1024 * 1024).to_f).round(2)
    if @file.size > max_size
      errors.add(:file, "is too big, #{max_size_in_mb}MB max")
      return
    end

    metadata = CartoDB::ImageMetadata.new(@file.path, extension: extension)
    errors.add(:file, "is too big, 1024x1024 max") if metadata.width > 1024 || metadata.height > 1024
    # If metadata reports no size, 99% sure not valid, so out
    errors.add(:file, "doesn't appear to be an image") if metadata.width == 0 || metadata.height == 0
  rescue StandardError => e
    errors.add(:file, "error while uploading: #{e.message}")
  end

  def asset_file_extension
    filename = asset_file.respond_to?(:original_filename) ? asset_file.original_filename : asset_file
    extension = File.extname(filename).downcase

    # Filename might include a postfix hash -- Rack::Test::UploadedFile adds it
    extension.gsub!(/\d+-\w+-\w+\z/, '') if Rails.env.test?

    extension if VALID_EXTENSIONS.include?(extension)
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
    obj = s3_bucket.object("#{target_asset_path}#{filename}")
    obj.upload_file(@file.path, acl: 'public-read', content_type: MIME::Types.type_for(filename).first.to_s)

    obj.public_url.to_s
  end

  def local_dir
    @local_dir ||= Pathname.new(public_uploaded_assets_path).join(target_asset_path)
  end

  def local_filename(filename)
    local_dir.join(filename)
  end

  def save_local(filename)
    FileUtils.mkdir_p local_dir
    FileUtils.cp @file.path, local_filename(filename)

    mode = chmod_mode
    FileUtils.chmod(mode, local_filename(filename)) if mode

    File.join('/', ASSET_SUBFOLDER, target_asset_path, ERB::Util.url_encode(filename))
  end

  def use_s3?
    Cartodb.get_config(:assets, "s3_bucket_name") && Cartodb.get_config(:aws, "s3")
  end

  def remove
    unless use_s3?
      local_url = CGI.unescape(public_url.gsub(/(http:)?\/\/#{CartoDB.account_host}/, ''))
      begin
        FileUtils.rm((public_uploaded_assets_path + local_url).gsub('/uploads/uploads/', '/uploads/'))
      rescue StandardError => e
        log_error(message: "Error removing asset", current_user: self, exception: e)
      end
      return
    end
    basename = File.basename(public_url)
    obj = s3_bucket.object("#{target_asset_path}#{basename}")
    obj.delete
  end

  def target_asset_path
    "#{Rails.env}/#{self.user.username}/assets/"
  end

  def s3_bucket
    s3_config = Cartodb.get_config(:aws, 's3').symbolize_keys
    Aws.config = s3_config
    s3 = Aws::S3::Resource.new
    @s3_bucket ||= s3.bucket(Cartodb.get_config(:assets, 's3_bucket_name'))
  end

  ASSET_SUBFOLDER = 'uploads'.freeze

  def absolute_public_url
    uri = URI.parse(public_url)
    (uri.absolute? ? uri : URI.join(base_domain, uri)).to_s
  rescue URI::InvalidURIError
    public_url
  end

  private

  def base_domain
    CartoDB.base_domain_from_name(user ? user.subdomain : organization.name)
  end

  def chmod_mode
    # Example in case asset kind should change mode
    # kind == KIND_ORG_AVATAR ? 0644 : nil
    0644
  end

  def asset_protocol
    # Avatars without protocol to allow the browser pick http/https.
    # Other assets with http, because, for example, tiler needs access to landmark images.
    kind == KIND_ORG_AVATAR ? '' : 'http:'
  end

end
