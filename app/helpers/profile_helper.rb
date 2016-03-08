# coding: utf-8

module ProfileHelper
  VALID_EXTENSIONS = %w{ .jpeg .jpg .gif .png }

  def valid_avatar_extension(file_src)
    VALID_EXTENSIONS.include?(File.extname(file_src))
  end
end
