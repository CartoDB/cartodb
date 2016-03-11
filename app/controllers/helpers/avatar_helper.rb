# coding: utf-8

module AvatarHelper
  VALID_EXTENSIONS = %w{ .jpeg .jpg .gif .png }

  def valid_avatar_file?(file_src)
    VALID_EXTENSIONS.include?(File.extname(file_src))
  end
end
