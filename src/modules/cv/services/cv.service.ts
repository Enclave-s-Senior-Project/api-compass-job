import { UpdateCvDto } from '../dtos/update-cv.dto';
import { CreateCvDto } from '../dtos/create-cv.dto';
import { Injectable } from '@nestjs/common';
import { CvRepository } from '../repositories/cv.repository';
import { CvEntity } from '@database/entities';
import { CvResponseDto, CvResponseDtoBuilder } from '../dtos/cv-response.dto';
import { CvErrorType } from '@common/errors/cv-error-type';
import { JwtPayload } from '@common/dtos';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';

@Injectable()
export class CvService {
    constructor(private readonly cvRepository: CvRepository) {}

    async getCvByID(id: string): Promise<CvEntity> {
        return await this.cvRepository.findOne({ where: { cvId: id } });
    }

    async getAllCvByIdProfile(id: string): Promise<CvResponseDto> {
        try {
            const listCvs = await this.cvRepository.find({ where: { profile: { profileId: id } } });
            return new CvResponseDtoBuilder().setValue(listCvs).success().build();
        } catch (error) {
            console.error('Error fetching profiles of list jobs:', error);
            return new CvResponseDtoBuilder().setCode(400).setMessageCode(CvErrorType.FETCH_CV_FAILED).build();
        }
    }

    async uploadCV(payload: CreateCvDto, user: JwtPayload) {
        try {
            let newCV = this.cvRepository.create({
                cvName: payload.cvName,
                cvUrl: payload.cvUrl,
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
}
