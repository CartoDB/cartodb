# encoding: utf-8

class Carto::AssetsStorage
  def initialize(namespace, file_path, acl)
    @namespace = namespace
    @file_path = file_path
    @acl = acl
  end
end
