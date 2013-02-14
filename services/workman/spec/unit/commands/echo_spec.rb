# encoding: utf-8
require 'open3'
require 'minitest/autorun'

describe 'echo command' do
  it 'returns an array of files and directories' do
    echo      = File.join(File.dirname(__FILE__), '../../../commands/echo')
    arguments = "foo"
    command   = "#{echo} #{arguments}"

    stdin, stdout, stderr = Open3.popen3(command)
    stdout.readlines.join.must_equal("foo\n")
  end
end # echo

