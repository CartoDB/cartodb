module Carto::FrameOptionsHelper
  def x_frame_options_allow
    response.headers.delete('X-Frame-Options')
  end
end
