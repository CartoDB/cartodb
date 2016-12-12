# encoding utf-8

class Carto::StorageOptions::Local
  include Carto::Configuration

  def initialize(location)
    @location = location
  end

  def upload(path, file)
    filename = Pathname.new(file.path).basename
    target_full_path = File.join(public_uploads_path,
                                 @location,
                                 path)
    FileUtils.mkdir_p(target_full_path)

    FileUtils.mv(file.path, target_full_path)

    url_path = File.join(target_full_path.gsub('public/', ''), filename)
    "#{CartoDB.protocol}://#{CartoDB.account_host}/#{url_path}"
  end

  def remove(path)
    File.delete(path) if File.exist?(path)
  end
end
