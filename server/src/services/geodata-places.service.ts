import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class GeodataPlacesService extends BaseService {
  
 


  async findPlaceByInstagramLocationId(instagramLocationId: string) {
    return this.geodataPlacesRepository.findPlaceByInstagramLocationId(instagramLocationId);
  }
}
