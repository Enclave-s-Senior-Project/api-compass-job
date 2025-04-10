import { PickType } from '@nestjs/mapped-types';
import { CreateFcmTokenDto } from './create-fcm-token.dto';

export class UpdateFCMTokenDto extends PickType(CreateFcmTokenDto, ['token'] as const) {}
