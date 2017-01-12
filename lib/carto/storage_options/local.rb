# encoding utf-8

class Carto::StorageOptions::Local
  def initialize(location)
    @location = location
  end

  def upload(path, file)
    filename = Pathname.new(file.path).basename
    target_directory = File.join('public/uploads',
                                 @location,
                                 path)

    FileUtils.mkdir_p(target_directory)
    FileUtils.mv(file.path, target_directory)

    identifier = File.join(target_directory, filename)
    url = File.join('http://',
                    CartoDB.account_host,
                    identifier.gsub('public/', ''))

    [identifier, url]
  end

  def remove(path)
    File.delete(path) if path && File.exist?(path)
  end
end
