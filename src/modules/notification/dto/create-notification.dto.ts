import { CreateNotificationDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { NotificationType } from '@src/database/entities/notification.entity';
import { IsString, IsNotEmpty, IsUrl, IsBoolean, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateNotificationDto {
    @IsUUID(undefined, { message: CreateNotificationDtoErrorType.ACCOUNT_ID_INVALID })
    @IsNotEmpty({ message: CreateNotificationDtoErrorType.ACCOUNT_ID_REQUIRED })
    accountId: string;

    @IsString({ message: CreateNotificationDtoErrorType.TITLE_INVALID })
    @IsNotEmpty({ message: CreateNotificationDtoErrorType.TITLE_REQUIRED })
    title: string;

    @IsString({ message: CreateNotificationDtoErrorType.MESSAGE_INVALID })
    @IsNotEmpty({ message: CreateNotificationDtoErrorType.MESSAGE_REQUIRED })
    message: string;

    @IsEnum({ message: CreateNotificationDtoErrorType.TYPE_INVALID })
    @IsNotEmpty({ message: CreateNotificationDtoErrorType.TYPE_REQUIRED })
    type: NotificationType;

    @IsUrl(undefined, { message: CreateNotificationDtoErrorType.LINK_INVALID })
    @IsOptional()
    link?: string;

    @IsBoolean({ message: CreateNotificationDtoErrorType.IS_READ_INVALID })
    @IsOptional()
    isRead?: boolean;
}
