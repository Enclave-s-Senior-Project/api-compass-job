import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { JobService } from '../job/service/job.service';
import { EnterpriseService } from '../enterprise/service/enterprise.service';
import { forwardRef, Inject } from '@nestjs/common';

export class EmbeddingService {
    constructor(
        @Inject(forwardRef(() => JobService))
        private readonly jobService: JobService,
        @Inject(forwardRef(() => EnterpriseService))
        private readonly enterpriseService: EnterpriseService
    ) {}

    public async createJobEmbedding(jobId: string) {
        try {
            const jobDetails = await this.jobService.getDetailJobById(jobId, null);

            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/job`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobDetails.value),
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteOneJobEmbedding(jobId: string) {
        try {
            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/job/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteManyJobEmbedding(jobIds: string[]) {
        try {
            if (jobIds.length === 0) {
                return;
            }

            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/job`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jobIds),
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async createEnterpriseEmbedding(enterpriseId: string) {
        try {
            const enterpriseDetails = await this.enterpriseService.findEnterpriseById(enterpriseId);

            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/enterprise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enterpriseDetails.value),
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteOneEnterpriseEmbedding(enterpriseId: string) {
        try {
            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/enterprise/${enterpriseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    public async deleteManyEnterpriseEmbedding(enterpriseIds: string[]) {
        try {
            if (enterpriseIds.length === 0) {
                return;
            }

            const res = await fetch(`${process.env.AI_SYSTEM_URL}/embedding/enterprise`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enterpriseIds),
            });

            return await res.json();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
