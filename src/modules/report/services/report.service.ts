import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from '../dtos/create-report.dto';
import { UpdateReportDto } from '../dtos/update-report.dto';
import { ReportEnterpriseEntity, ReportEnterpriseStatus } from '@database/entities/report-enterprise.entity';
import { ReportResponseDtoBuilder } from '../dtos/report-response.dto';
import { PaginationDto } from '@src/common/dtos';
import { ReportFilterDto } from '../dtos/params-report.dto';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(ReportEnterpriseEntity)
        private readonly reportRepository: Repository<ReportEnterpriseEntity>
    ) {}

    async create(createDto: CreateReportDto, profileId: string) {
        try {
            const existingReport = await this.reportRepository.findOne({
                where: {
                    enterprise: { enterpriseId: createDto.enterpriseId },
                    profile: { profileId },
                    status: ReportEnterpriseStatus.PENDING,
                },
                relations: ['enterprise', 'profile'],
            });

            if (existingReport) {
                throw new BadRequestException('ALREADY_REPORTED');
            }

            const report = this.reportRepository.create({
                reason: createDto.reason,
                status: ReportEnterpriseStatus.PENDING,
                fileAttachment: createDto.fileAttachment,
                enterprise: { enterpriseId: createDto.enterpriseId },
                profile: { profileId },
            });

            const savedReport = await this.reportRepository.save(report);
            return new ReportResponseDtoBuilder().setValue('REPORT_ENTERPRISE_SUCCESSFUL').success().build();
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, updateDto: UpdateReportDto) {
        try {
            const report = await this.reportRepository.findOne({
                where: { reportEnterpriseId: id },
                relations: ['enterprise', 'profile'],
            });

            if (!report) {
                throw new NotFoundException('Report not found');
            }

            Object.assign(report, updateDto);
            const updatedReport = await this.reportRepository.save(report);
            return new ReportResponseDtoBuilder().setValue(updatedReport).success().build();
        } catch (error) {
            throw error;
        }
    }

    async delete(id: string) {
        try {
            const result = await this.reportRepository.delete({ reportEnterpriseId: id });
            if (result.affected === 0) {
                throw new NotFoundException('Report not found');
            }
            return new ReportResponseDtoBuilder().setValue(null).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const report = await this.reportRepository.findOne({
                where: { reportEnterpriseId: id },
                relations: ['enterprise', 'profile'],
            });

            if (!report) {
                throw new NotFoundException('Report not found');
            }

            return new ReportResponseDtoBuilder().setValue(report).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getByEnterprise(enterpriseId: string) {
        try {
            const reports = await this.reportRepository.find({
                where: { enterprise: { enterpriseId } },
                relations: ['enterprise', 'profile'],
                order: { status: 'ASC' },
            });
            return new ReportResponseDtoBuilder().setValue(reports).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getByProfile(profileId: string) {
        try {
            const reports = await this.reportRepository.find({
                where: { profile: { profileId } },
                relations: ['enterprise', 'profile'],
                order: { status: 'ASC' },
            });
            return new ReportResponseDtoBuilder().setValue(reports).success().build();
        } catch (error) {
            throw error;
        }
    }

    async getByStatus(status: ReportEnterpriseStatus) {
        try {
            const reports = await this.reportRepository.find({
                where: { status },
                relations: ['enterprise', 'profile'],
                order: { status: 'ASC' },
            });
            return new ReportResponseDtoBuilder().setValue(reports).success().build();
        } catch (error) {
            throw error;
        }
    }
    async getAll(query: ReportFilterDto) {
        try {
            const reports = await this.reportRepository.find({
                where: { status: query.status },
                skip: query.skip,
                take: query.take,
                relations: ['enterprise', 'profile'],
                order: { status: 'ASC' },
            });
            return new ReportResponseDtoBuilder().setValue(reports).success().build();
        } catch (error) {
            throw error;
        }
    }
}
