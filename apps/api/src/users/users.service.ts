import { Injectable } from '@nestjs/common';

type User = {
  userId: string;
  username: string;
  password: string;
};

const users: User[] = [
  {
    userId: '1',
    username: 'john',
    password: 'wao',
  },
];

@Injectable()
export class UsersService {
  async findUserByName(username: string): Promise<User | undefined> {
    return users.find((u) => u.username === username);
  }
}
