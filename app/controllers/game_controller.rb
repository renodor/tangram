# frozen_string_literal:true

class GameController < ApplicationController
  before_action :authenticate_user!

  def play
    @patterns = Pattern.all
    @current_pattern = @patterns.sample
    @solved_patterns = current_user.patterns
  end
end
