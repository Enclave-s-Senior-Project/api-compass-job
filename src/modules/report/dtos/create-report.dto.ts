import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, max, MaxLength } from 'class-validator';

export class CreateReportDto {
    @ApiProperty({
        description: 'Reason for the report',
        example: 'Inappropriate content or behavior',
    })
    @IsNotEmpty()
    @IsString()
    readonly reason: string;

    @ApiProperty({
        description: 'ID of the enterprise being reported',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsUUID()
    readonly enterpriseId: string;

    @ApiProperty({
        description: 'File attachments',
        example: ['https://example.com/file1.jpg', 'https://example.com/file2.jpg'],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    readonly fileAttachment: string[];
}
