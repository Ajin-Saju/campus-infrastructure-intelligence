import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingRepository } from './building.repository';
import { BuildingController } from './building.controller';

@Module({
  controllers: [BuildingController],
  providers: [BuildingService, BuildingRepository],
  exports: [BuildingService, BuildingRepository],
})
export class BuildingModule {}
