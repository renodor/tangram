# frozen_string_literal:true

class SolutionsController < ApplicationController
  skip_forgery_protection

  def create
    return unless current_user&.admin?

    solution = Solution.create!(pattern_id: params[:pattern_id])
    params[:polygons].each do |polygon|
      solution.polygons.create!(
        shape: polygon[:shape].underscore,
        points: polygon[:points]
      )
    end

    head :created
  end
end
