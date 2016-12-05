# encoding utf-8

class Carto::StorageOptions::Local
  include Carto::Configuration

  attr_reader :subfolder
  def initialize(subfolder)
    @subfolder = subfolder
  end

  def upload(namespaced_name, file)
    filename = Pathname.new(file.path).basename
    target_full_path = File.join(public_uploads_path,
                                 subfolder,
                                 namespaced_name)
    FileUtils.mkdir_p(target_full_path)

    FileUtils.mv(file.path, target_full_path)

    url_path = File.join(target_full_path.gsub('public/', ''), filename)
    "#{CartoDB.protocol}://#{CartoDB.account_host}/#{url_path}"
  end

  def remove(namespaced_name)
    File.delete(namespaced_name) if File.exist?(namespaced_name)
  end
end
