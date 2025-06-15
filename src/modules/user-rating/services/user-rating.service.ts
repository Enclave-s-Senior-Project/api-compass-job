import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserRatingDto } from '../dtos/create-user-rating.dto';
import { UpdateUserRatingDto } from '../dtos/update-user-rating.dto';
import { UserRatingEntity } from '@database/entities/user-rating.entity';
import { UserRatingResponseDtoBuilder } from '../dtos/user-rating-response.dto';
import { UserRatingResponseDto } from '../dtos';
import { ReviewSummaryResponseDto } from '../dtos/review-summary-response.dto';
import { PaginationDto } from '@src/common/dtos/page-option.dto';

@Injectable()
export class UserRatingService {
    constructor(
        @InjectRepository(UserRatingEntity)
        private readonly userRatingRepository: Repository<UserRatingEntity>
    ) {}

    async create(createDto: CreateUserRatingDto, profileId: string): Promise<UserRatingResponseDto> {
        try {
            const existingRating = await this.userRatingRepository.findOne({
                where: {
                    enterprise: { enterpriseId: createDto.enterpriseId },
                    profile: { profileId: profileId },
                },
                relations: ['enterprise', 'profile'],
            });

            if (existingRating) {
                throw new BadRequestException('ALREADY_RATED');
            }

            const rating = this.userRatingRepository.create({
                rating: createDto.rating,
                comment: createDto.comment,
                enterprise: { enterpriseId: createDto.enterpriseId },
                profile: { profileId: profileId },
            });

            const savedRating = await this.userRatingRepository.save(rating);
            return new UserRatingResponseDtoBuilder().setValue(savedRating).success().build();
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, updateDto: UpdateUserRatingDto, profileId: string): Promise<UserRatingResponseDto> {
        try {
            const rating = await this.userRatingRepository.findOne({
                where: { userRatingId: id },
                relations: ['enterprise', 'profile'],
            });

            if (!rating) {
                throw new NotFoundException('Rating not found');
            }

            if (rating.profile.profileId !== profileId) {
                throw new ForbiddenException('You are not authorized to update this rating');
            }

            Object.assign(rating, updateDto);
            const updatedRating = await this.userRatingRepository.save(rating);
            return new UserRatingResponseDtoBuilder().setValue(updatedRating).success().build();
        } catch (error) {
            throw error;
        }
    }

    async delete(id: string, profileId: string): Promise<UserRatingResponseDto> {
        try {
            const rating = await this.userRatingRepository.findOne({
                where: { userRatingId: id },
                relations: ['enterprise', 'profile'],
            });

            if (!rating) {
                throw new NotFoundException('Rating not found');
            }

            if (rating.profile.profileId !== profileId) {
                throw new ForbiddenException('You are not authorized to delete this rating');
            }

            await this.userRatingRepository.delete({ userRatingId: id });
            return new UserRatingResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getById(id: string): Promise<UserRatingResponseDto> {
        try {
            const rating = await this.userRatingRepository.findOne({
                where: { userRatingId: id },
            });

            if (!rating) {
                throw new NotFoundException('Rating not found');
            }

            return new UserRatingResponseDtoBuilder().setValue(rating).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getByEnterprise(enterpriseId: string, pageOptionsDto: PaginationDto): Promise<UserRatingResponseDto> {
        try {
            const { skip, take } = pageOptionsDto;
            const ratings = await this.userRatingRepository.find({
                where: { enterprise: { enterpriseId } },
                relations: ['profile'],
                order: { rating: 'DESC' },
                select: {
                    userRatingId: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    profile: {
                        profileId: true,
                        fullName: true,
                        profileUrl: true,
                    },
                },
                skip,
                take,
            });
            return new UserRatingResponseDtoBuilder().setValue(ratings).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getAverageRatingByEnterprise(enterpriseId: string): Promise<UserRatingResponseDto> {
        try {
            const result = await this.userRatingRepository
                .createQueryBuilder('rating')
                .select('AVG(rating.rating)', 'average')
                .where('rating.enterprise.enterpriseId = :enterpriseId', { enterpriseId })
                .getRawOne();

            return new UserRatingResponseDtoBuilder()
                .setValue(result?.average || 0)
                .success()
                .build();
        } catch (error) {
            throw error;
        }
    }

    async getReviewSummaryByEnterprise(enterpriseId: string): Promise<UserRatingResponseDto> {
        try {
            const [ratings, averageResult] = await Promise.all([
                this.userRatingRepository.find({
                    where: { enterprise: { enterpriseId } },
                    select: ['rating'],
                }),
                this.userRatingRepository
                    .createQueryBuilder('rating')
                    .select('AVG(rating.rating)', 'average')
                    .where('rating.enterprise.enterpriseId = :enterpriseId', { enterpriseId })
                    .getRawOne(),
            ]);

            const ratingDistribution = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
            };

            ratings.forEach((rating) => {
                ratingDistribution[rating.rating]++;
            });

            return new UserRatingResponseDtoBuilder()
                .setValue({
                    averageRating: parseFloat(averageResult?.average || '0'),
                    totalReviews: ratings.length,
                    ratingDistribution,
                })
                .success()
                .build();
        } catch (error) {
            throw error;
        }
    }
}
