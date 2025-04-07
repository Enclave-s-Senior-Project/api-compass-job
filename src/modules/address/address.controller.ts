import { Body, Controller, Get, HttpCode, Param, Patch, Post, Delete, Query, ValidationPipe } from '@nestjs/common';
import { AddressService } from './service/address.service';
import {
    ApiBearerAuth,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import { AddressResponseDto, CreateAddressDto, UpdateAddressDto } from './dtos/';
import { JwtPayload, PaginationDto } from '@common/dtos';
import { CurrentUser, SkipAuth, TOKEN_NAME } from '@modules/auth';

@ApiTags('Address')
@Controller({
    path: 'address',
    version: '1',
})
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @SkipAuth()
    @Post()
    @HttpCode(201)
    @ApiOperation({ summary: 'Create address', description: 'Create a new address.' })
    @ApiCreatedResponse({ description: 'Address created successfully.', type: AddressResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid address data.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async createAddress(@Body(ValidationPipe) createAddressDto: CreateAddressDto): Promise<AddressResponseDto> {
        return this.addressService.create(createAddressDto);
    }

    @SkipAuth()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: 'Get all addresses', description: 'Retrieve all addresses with pagination support.' })
    @ApiOkResponse({ description: 'Addresses retrieved successfully.', type: AddressResponseDto })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async getAllAddresses(@Query() pageOptionsDto: PaginationDto): Promise<AddressResponseDto> {
        return this.addressService.findAll(pageOptionsDto);
    }

    @SkipAuth()
    @Get(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Get address by ID', description: 'Retrieve a single address by its ID.' })
    @ApiOkResponse({ description: 'Address retrieved successfully.', type: AddressResponseDto })
    @ApiNotFoundResponse({ description: 'Address not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async getAddressById(@Param('id') id: string): Promise<AddressResponseDto> {
        return this.addressService.findOne(id);
    }

    @SkipAuth()
    @Patch(':id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Update address', description: 'Update an existing address by its ID.' })
    @ApiOkResponse({ description: 'Address updated successfully.', type: AddressResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid update data.' })
    @ApiNotFoundResponse({ description: 'Address not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async updateAddress(
        @Param('id') id: string,
        @Body(ValidationPipe) updateAddressDto: UpdateAddressDto
    ): Promise<AddressResponseDto> {
        return this.addressService.update(id, updateAddressDto);
    }

    @SkipAuth()
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete address', description: 'Remove an address by its ID.' })
    @ApiNoContentResponse({ description: 'Address deleted successfully.' })
    @ApiNotFoundResponse({ description: 'Address not found.' })
    @ApiInternalServerErrorResponse({ description: 'Server error.' })
    async deleteAddress(@Param('id') id: string): Promise<void> {
        return this.addressService.remove(id);
    }
}
