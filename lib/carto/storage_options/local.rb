class Carto::StorageOptions::Local
  include Carto::Configuration

  def initialize(location)
    @location = location
  end

  def upload(path, file)
    filename = Pathname.new(file.path).basename
    target_directory = File.join(public_uploaded_assets_path,
                                 @location,
                                 path)

    FileUtils.mkdir_p(target_directory)
    FileUtils.mv(file.path, target_directory)

    target_file_path = File.join(target_directory, filename)
    # NOTE: default permissions are 0600, which don't allow nginx to
    # serve them
    FileUtils.chmod(0o644, target_file_path)
    url = File.join('/uploads', @location, path, filename)

    [target_file_path, url]
  end

  def remove(path)
    File.delete(path) if path && File.exist?(path)
  end
end
