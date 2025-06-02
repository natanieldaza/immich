import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';

import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonService } from 'src/services/person.service';

import { PersonRelationshipDto } from 'src/dtos/person-relationship.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';


@ApiTags('Person Relationship')
@Controller('person-relationship')
export class PersonRelationshipController {
  constructor(
    private service: PersonService,
    private logger: LoggingRepository,) {}
 
  //create a relationship
  @Authenticated({ permission: Permission.PARTNER_UPDATE })
  @Post()
  async createRelationship(
    @Auth() auth: AuthDto,
    @Body() dto: PersonRelationshipDto,
  ): Promise<PersonResponseDto> {
    const relationship = await this.service.createRelationship(auth,  
      dto.personId,
      dto.relatedPersonId,
      dto.type,
    ) 
    this.logger.log('createRelationship', {
      userId: auth.user.id,
      relatedPersonId: dto.relatedPersonId,
      type: dto.type,
    });
    return relationship;
  }

  //get all relationships person relationships
  @Authenticated({ permission: Permission.PARTNER_UPDATE })
  @Get(':id')
  async getPersonRelationships(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
  ): Promise<PersonRelationshipDto[]> {
    const relationships = await this.service.getAllRelationships(auth, id);
    if (!relationships) {
      throw new NotFoundException('No relationships found');
    }
    return relationships;
  }
  
    
}