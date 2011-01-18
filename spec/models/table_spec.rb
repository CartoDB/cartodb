require 'spec_helper'

describe Table do
  it "should have a privacy associated and it should be private by default" do
    table = Table.new
    table.privacy.should be_nil
    table.should be_private
  end
end
