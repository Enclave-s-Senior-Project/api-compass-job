import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from '../../roles/dtos';
import { UserStatus } from '../user-status.enum';

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty({ type: [RoleResponseDto] })
    roles?: RoleResponseDto[];

    @ApiProperty()
    isSuperUser: boolean;

    @ApiProperty()
    status: UserStatus;
}
