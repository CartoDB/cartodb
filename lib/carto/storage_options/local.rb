# encoding utf-8

class Carto::StorageOptions::Local
  include Carto::Configuration

  def initialize(location)
    @location = location
  end

  def upload(path, file)
    filename = Pathname.new(file.path).basename
    target_directory = File.join(public_uploads_path,
                                 @location,
                                 path)

    FileUtils.mkdir_p(target_directory)
    FileUtils.mv(file.path, target_directory)

    target_full_path = File.join(target_directory, filename)
    url_path = File.join('http://',
                         CartoDB.account_host,
                         target_full_path.gsub('public/', ''))

    [target_full_path, url_path]
  end

  def remove(path)
    File.delete(path) if File.exist?(path)
  end
end
