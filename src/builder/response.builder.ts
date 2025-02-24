import { BaseResponseDto } from '@common/dtos/response.dto';
import { ErrorType } from '@common/enums';

export class BaseResponseDtoBuilder<T extends BaseResponseDto> {
    protected responseDto: T;

    constructor(responseDto: new (code: number, message_code: string) => T) {
        this.responseDto = new responseDto(200, 'SUCCESS');
    }

    public setCode(code: number): this {
        this.responseDto.code = code;
        return this;
    }

    public setMessageCode(messageCode: string): this {
        this.responseDto.message_code = messageCode;
        return this;
    }
    public setValue(value: any): this {
        this.responseDto.value = value;
        return this;
    }

    public badRequest(): this {
        return this.setCode(400).setMessageCode('BAD_REQUEST');
    }

    public success(): this {
        return this.setCode(200).setMessageCode('SUCCESS');
    }

    public badRequestContent(message): this {
        return this.setCode(400).setMessageCode(message);
    }

    public internalServerError(): this {
        return this.setCode(500).setMessageCode(ErrorType.InternalErrorServer);
    }

    public build(): T {
        return this.responseDto;
    }
}
