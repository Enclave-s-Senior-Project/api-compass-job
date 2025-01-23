import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Addresses } from './Addresses';
import { Profiles } from './Profiles';

@Index('user_addresses_profile_id_address_id_key', ['addressId', 'profileId'], {
  unique: true,
})
@Index('user_addresses_pkey', ['id'], { unique: true })
@Entity('user_addresses', { schema: 'public' })
export class UserAddresses {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('uuid', { name: 'profile_id', nullable: true, unique: true })
  profileId: string | null;

  @Column('uuid', { name: 'address_id', nullable: true, unique: true })
  addressId: string | null;

  @ManyToOne(() => Addresses, (addresses) => addresses.userAddresses)
  @JoinColumn([{ name: 'address_id', referencedColumnName: 'id' }])
  address: Addresses;

  @ManyToOne(() => Profiles, (profiles) => profiles.userAddresses)
  @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
  profile: Profiles;
}
