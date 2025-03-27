import { CreateCandidateWishListErrorType } from '@common/errors/class-validator-error-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCandidateWishListDtoCandidate {
    @ApiProperty({
        example: '6104179295f14b72d4524894',
    })
    @IsString({ message: CreateCandidateWishListErrorType.STRING_CANDIDATE_ID })
    @IsNotEmpty({ message: CreateCandidateWishListErrorType.REQUIRED_CANDIDATE_ID })
    readonly profileId: string;
}
