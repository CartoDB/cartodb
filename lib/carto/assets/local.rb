# encoding utf-8

class Carto::Storage::Local
  def upload(namespaced_name, file)
    FileUtils.mv(file.path, namespaced_name)
  end

  def remove(namespaced_name)
    File.delet(namespaced_name) if File.exist?(namespaced_name)
  end
end
