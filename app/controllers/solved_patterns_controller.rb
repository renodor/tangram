# frozen_string_literal:true

class SolvedPatternsController < ApplicationController
  skip_forgery_protection # TODO: too easy to artificially create solved patterns by sending requests...

  def create
    return unless user_signed_in? # TODO: use devise built in methods

    SolvedPattern.create(user_id: current_user.id, pattern_id: params[:pattern_id])

    pattern = Pattern.find(params[:pattern_id])
    render json: {
      pun: pattern.pun,
      svgTag: helpers.svg("patterns/#{pattern.name}_revealed.svg")
    }
  end
end
