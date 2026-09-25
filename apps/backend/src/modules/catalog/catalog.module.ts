import { ManagementModule } from '../management/management.module';
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

@Module({ imports: [ManagementModule], controllers: [CatalogController] })
export class CatalogModule {}
