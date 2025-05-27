import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EnterpriseService } from '../enterprise/service/enterprise.service';
import { UserService } from '../user/service';
import { AuthService } from '../auth';
import { DashboardResponseDtoBuilder } from './dashboard.builder';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { JobService } from '../job/service/job.service';
import { ApplyJobService } from '../apply-job/services/apply-job.service';
import { ApplyJobResponseDtoBuilder } from '../apply-job/dtos';
import { HistoryTransactionService } from '../history-transaction/history-transaction.service';
import { CategoryService } from '../category/services';

@Injectable()
export class DashboardService {
    constructor(
        @Inject(forwardRef(() => EnterpriseService)) private readonly enterpriseService: EnterpriseService,
        @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        @Inject(forwardRef(() => JobService)) private readonly jobService: JobService,
        @Inject(forwardRef(() => ApplyJobService)) private readonly applyJobService: ApplyJobService,
        @Inject(forwardRef(() => HistoryTransactionService))
        private readonly historyTransactionService: HistoryTransactionService,
        @Inject(forwardRef(() => CategoryService)) private readonly categoryService: CategoryService
    ) {}

    async total() {
        try {
            const totalUser = await this.authService.totalUser();
            const totalEnterprise = await this.enterpriseService.getTotalEnterprise();
            const totalCandidate = await this.userService.countUsers();
            const totalJob = await this.jobService.getTotalJob();
            const result = {
                totalUser,
                totalEnterprise,
                totalCandidate,
                totalJob,
            };
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getListCandidateApply(company: string) {
        try {
            const applyJobs = await this.applyJobService.getListCandidateApplyDashboard(company);
            const enterprises = applyJobs.map((item) => ({ name: item.job.enterprise.name }));
            const result = { applyJobs, enterprises };
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getListTopAppliedJob() {
        try {
            const result = await this.applyJobService.getTopAppliedJobs();
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getDataRevenue() {
        try {
            const result = await this.historyTransactionService.getMonthlyRevenue();
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async totalHomePage() {
        try {
            const [totalUser, totalEnterprise, totalJobActive, totalJob] = await Promise.all([
                this.authService.totalUser(),
                this.enterpriseService.getTotalEnterprise(),
                this.jobService.getTotalJobActive(),
                this.jobService.getTotalJob(),
            ]);

            const result = { totalUser, totalEnterprise, totalJob, totalJobActive };
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getListCategoryChildrenHomePage() {
        try {
            const result = await this.categoryService.findChildrenHomePage();
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getListCategoryParentHomePage() {
        try {
            const result = await this.categoryService.findParentCategories();
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getJobHomePage() {
        try {
            const result = await this.jobService.getJobHomePage();
            return new DashboardResponseDtoBuilder().setValue(result).success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
