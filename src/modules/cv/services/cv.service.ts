import { UpdateCvDto } from './../dto/update-cv.dto';
import { CreateCvDto } from './../dto/create-cv.dto';
import { Injectable } from '@nestjs/common';
import { CvRepository } from '../repositories/cv.repository';
import { CvEntity } from '@database/entities';

@Injectable()
export class CvService {
    constructor(private readonly cvRepository: CvRepository) {}

    async getCvByID(id: string): Promise<CvEntity> {
        return this.cvRepository.findOne({ where: { cvId: id } });
    }
    create(createCvDto: CreateCvDto) {
        return 'This action adds a new cv';
    }

    findAll() {
        return `This action returns all cv`;
    }

    findOne(id: number) {
        return `This action returns a #${id} cv`;
    }

    update(id: number, updateCvDto: UpdateCvDto) {
        return `This action updates a #${id} cv`;
    }

    remove(id: number) {
        return `This action removes a #${id} cv`;
    }
}
