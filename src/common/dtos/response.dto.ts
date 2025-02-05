import { ApiProperty } from '@nestjs/swagger';

/**
 * Dto for the response
 */
export class ResponseDto<T> {
    @ApiProperty()
    payload: T;
    @ApiProperty({ example: 1617826799860 })
    timestamp: number;
}
export class BaseResponseDto<T = any> {
    code: number;
    message_code: string;
    value?: T;
    constructor(code: number, message_code: string, value?: T) {
        this.code = code;
        this.message_code = message_code;
        this.value = value;
    }
}
