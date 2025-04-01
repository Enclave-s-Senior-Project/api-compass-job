import { CreateCvDto } from '../dtos/create-cv.dto';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { CvRepository } from '../repositories/cv.repository';
import { CvEntity } from '@database/entities';
import { CvResponseDto, CvResponseDtoBuilder } from '../dtos/cv-response.dto';
import { CvErrorType } from '@common/errors/cv-error-type';
import { JwtPayload } from '@common/dtos';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { UpdateCvDto } from '../dtos/update-cv.dto';

@Injectable()
export class CvService {
    constructor(private readonly cvRepository: CvRepository) {}

    async getCvByID(id: string): Promise<CvEntity> {
        return await this.cvRepository.findOne({ where: { cvId: id } });
    }

    async getOwnCV(id: string): Promise<CvResponseDto> {
        try {
            const listCvs = await this.cvRepository.find({ where: { profile: { profileId: id } } });
            return new CvResponseDtoBuilder().setValue(listCvs).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getCvByUserId(profileId: string): Promise<CvResponseDto> {
        try {
            const listCvs = await this.cvRepository.find({
                where: {
                    profile: {
                        profileId: profileId,
                    },
                    isPublished: true,
                },
                relations: {
                    profile: {
                        account: true,
                    },
                },
                select: {
                    profile: {},
                },
            });
            return new CvResponseDtoBuilder().setValue(listCvs).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async uploadCV(payload: CreateCvDto, user: JwtPayload) {
        try {
            let newCV = this.cvRepository.create({
                cvName: payload.cvName,
                cvUrl: payload.cvUrl,
                size: payload.size,
                isPublished: payload.isPublished,
                profile: { profileId: user.profileId },
            });
            newCV = await this.cvRepository.save(newCV);
            const { appliedJob, isActive, profile, ...returnValue } = newCV;
            return new CvResponseDtoBuilder().setValue(returnValue).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updateCV(cvId: string, payload: UpdateCvDto, user: JwtPayload) {
        try {
            const existedCV = await this.cvRepository.exists({
                where: {
                    cvId: cvId,
                    profile: { profileId: user.profileId },
                },
            });

            if (!existedCV) {
                throw new NotFoundException(CvErrorType.CV_NOT_FOUND);
            }
            const updatedCV = await this.cvRepository.update(
                {
                    cvId: cvId,
                    profile: { profileId: user.profileId },
                },
                {
                    cvName: payload.cvName,
                    isPublished: payload.isPublished,
                }
            );
            return new CvResponseDtoBuilder().setValue(updatedCV).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async deleteCV(cvId: string, user: JwtPayload): Promise<CvResponseDto> {
        try {
            const existedCV = await this.cvRepository.exists({
                where: {
                    cvId: cvId,
                    profile: { profileId: user.profileId },
                },
            });

            if (!existedCV) {
                throw new NotFoundException(CvErrorType.CV_NOT_FOUND);
            }

            // Check if the CV is in use
            const cvInUse = await this.cvRepository.exists({
                where: {
                    appliedJob: { cv: { cvId: cvId } },
                },
            });

            if (cvInUse) {
                throw new NotAcceptableException(CvErrorType.CV_IN_USE);
            }

            const deleteResult = await this.cvRepository.delete({
                cvId: cvId,
                profile: { profileId: user.profileId },
            });

            return new CvResponseDtoBuilder().setValue(deleteResult).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
