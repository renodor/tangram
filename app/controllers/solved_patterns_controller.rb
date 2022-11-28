# frozen_string_literal:true

class SolvedPatternsController < ApplicationController
  skip_forgery_protection # TODO: too easy to artificially create solved patterns by sending requests...

  def create
    return unless user_signed_in? # TODO: use devise built in methods

    pattern = Pattern.find(params[:pattern_id])

    if pattern.solved?(current_user)
      head :no_content
    else
      SolvedPattern.create(user_id: current_user.id, pattern_id: params[:pattern_id])
      render html: helpers.svg("patterns/#{pattern.name}_revealed.svg")
    end
  end
end
