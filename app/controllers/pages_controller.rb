# frozen_string_literal:true

class PagesController < ApplicationController
  def home
    @patterns = Pattern.all
    @current_pattern = @patterns.sample
  end
end
