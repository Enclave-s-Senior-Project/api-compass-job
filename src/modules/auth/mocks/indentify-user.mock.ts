import { HashHelper } from '@helpers';

export const initializeHardcodedUsers = async () => [
  {
    id: 1,
    username: 'nhatlinh.dut.3@gmail.com',
    password: await HashHelper.encrypt('Hello123'),
    status: 'Active',
    roles: ['user'],
  },
  {
    id: 2,
    username: 'aSmith',
    password: await HashHelper.encrypt('Hello123'),
    status: 'Blocked',
    roles: ['admin'],
  },
];

// Usage
export let hardcodedUsers = [];

(async () => {
  hardcodedUsers = await initializeHardcodedUsers();
})();
