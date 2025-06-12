import { ChangeParentDtoErrorType } from '@src/common/errors/class-validator-error-type';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeParentDto {
    @ApiProperty({
        description: 'UUID v4 of the new parent category',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: ChangeParentDtoErrorType.INVALID_ID })
    @IsNotEmpty({ message: ChangeParentDtoErrorType.ID_REQUIRED })
    parentId: string;
}
