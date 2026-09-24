import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  listUsers() {
    return {
      data: [
        { id: 'usr_1', name: 'Alicia Johnson', role: 'superadmin' },
        { id: 'usr_2', name: 'Ravi Patel', role: 'vendor_admin' },
        { id: 'usr_3', name: 'Maria Gomez', role: 'customer' },
      ],
    };
  }
}
