# this test controller renders the html with all the
# javascript stuff to run the specs
class TestController < ApplicationController

  def index
    render :layout => false
  end

end
