import { ManagementModule } from '../management/management.module';
import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';

@Module({ imports: [ManagementModule], controllers: [VendorsController] })
export class VendorsModule {}
