import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto, AddressResponseDtoBuilder } from '../dtos';
import { AddressRepository } from '../repositories/address.repository';
import { PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { AddressEntity } from '@database/entities';

@Injectable()
export class AddressService {
    constructor(private readonly addressRepository: AddressRepository) {}

    async create(createAddressDto: CreateAddressDto): Promise<AddressResponseDto> {
        try {
            const newAddress = this.addressRepository.create(createAddressDto);
            const savedAddress = await this.addressRepository.save(newAddress);
            return new AddressResponseDtoBuilder().setCode(201).build();
        } catch (error) {
            throw new BadRequestException('Failed to create address. Please check the provided data.');
        }
    }

    async findAll(paginationDto: PaginationDto): Promise<AddressResponseDto> {
        try {
            const { page = 1, take = 10 } = paginationDto;
            const [addresses, total] = await this.addressRepository.findAndCount({
                skip: (page - 1) * take,
                take: take,
                order: { createdAt: 'DESC' },
            });

            const meta = new PageMetaDto({
                pageOptionsDto: paginationDto,
                itemCount: total,
            });

            return new AddressResponseDtoBuilder()
                .setValue(new PageDto<AddressEntity>(addresses, meta))
                .success()
                .build();
        } catch (error) {
            console.error('Error fetching addresses:', error);
            throw new InternalServerErrorException('Failed to retrieve addresses.');
        }
    }

    async findOne(id: string): Promise<AddressResponseDto> {
        const address = await this.addressRepository.findOneBy({ addressId: id });

        if (!address) {
            throw new NotFoundException(`Address with ID ${id} not found.`);
        }

        return new AddressResponseDtoBuilder().setValue(address).success().build();
    }

    async update(id: string, updateAddressDto: UpdateAddressDto): Promise<AddressResponseDto> {
        const address = await this.addressRepository.findOneBy({ addressId: id });

        if (!address) {
            throw new NotFoundException(`Address with ID ${id} not found.`);
        }

        try {
            const updatedAddress = Object.assign(address, updateAddressDto);
            const savedAddress = await this.addressRepository.save(updatedAddress);
            return new AddressResponseDtoBuilder().setValue(savedAddress).success().build();
        } catch (error) {
            throw new BadRequestException('Failed to update address. Please check the provided data.');
        }
    }

    async remove(id: string): Promise<void> {
        const address = await this.addressRepository.findOneBy({ addressId: id });

        if (!address) {
            throw new NotFoundException(`Address with ID ${id} not found.`);
        }

        try {
            await this.addressRepository.remove(address);
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete address.');
        }
    }
    async getAddressByIds(ids: string[]): Promise<AddressEntity[]> {
        return this.addressRepository.findByIds(ids);
    }
}
