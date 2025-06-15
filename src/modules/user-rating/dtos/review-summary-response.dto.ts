import { ApiProperty } from '@nestjs/swagger';

export class ReviewSummaryResponseDto {
    @ApiProperty({ description: 'Average rating of the enterprise' })
    averageRating: number;

    @ApiProperty({ description: 'Total number of reviews' })
    totalReviews: number;

    @ApiProperty({
        description: 'Distribution of ratings from 1 to 5',
        example: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    })
    ratingDistribution: {
        [key: number]: number;
    };
}
