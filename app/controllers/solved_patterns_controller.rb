# frozen_string_literal:true

class SolvedPatternsController < ApplicationController
  skip_forgery_protection # TODO: too easy to artificially create solved patterns by sending requests...

  def create
    return unless user_signed_in?

    # If user already saved this pattern, creation will just silently fail
    SolvedPattern.create(user_id: current_user.id, pattern_id: params[:pattern_id])

    head :ok
  end
end
