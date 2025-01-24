import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    active: boolean;
}
