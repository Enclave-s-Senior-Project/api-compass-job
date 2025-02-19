import { Module } from '@nestjs/common';
import { AddressService } from './service/address.service';
import { AddressController } from './address.controller';
import { AddressRepository } from './repositories/address.repository';
import { TmpModule } from '@modules/tmp/tmp.module';

@Module({
    imports: [TmpModule],
    controllers: [AddressController],
    providers: [AddressService, AddressRepository],
})
export class AddressModule {}
