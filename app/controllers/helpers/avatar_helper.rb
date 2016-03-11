# coding: utf-8

module AvatarHelper
  AVATAR_VALID_EXTENSIONS = %w{ jpeg jpg gif png }

  def valid_avatar_file?(file_src)
    AVATAR_VALID_EXTENSIONS.include?(File.extname(file_src).tr('.', ''))
  end
end
