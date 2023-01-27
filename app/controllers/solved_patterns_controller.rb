# frozen_string_literal:true

class SolvedPatternsController < ApplicationController
  before_action :authenticate_user!
  skip_forgery_protection # TODO: too easy to artificially create solved patterns by sending requests...

  def create
    SolvedPattern.create(user_id: current_user.id, pattern_id: params[:pattern_id])

    pattern = Pattern.find(params[:pattern_id])
    render json: {
      pun: pattern.pun,
      svgTag: helpers.svg("patterns/#{pattern.name}_revealed.svg")
    }
  end
end
