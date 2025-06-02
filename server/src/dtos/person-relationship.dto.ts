import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { RelationshipType } from 'src/enum';

export class RelatedPersonDto {
  
  @ApiProperty()
  @IsString()
  id!: string;
  
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  birthDate!: Date | string | null;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  age!: number | null;

  @ApiProperty()
  @IsOptional()
  @IsString()
  thumbnailPath!: string;
}

export class PersonRelationshipDto {

  @ApiProperty()
  @IsString()
  personId!: string;

  @ApiProperty()
  @IsString()
  relatedPersonId!: string;

  @ApiProperty()
  @IsString()
  type!: RelationshipType;
  
  @ApiProperty()
  @IsString()
  direction!: 'asSource' | 'asTarget';
  
  @ApiProperty({ type: RelatedPersonDto })
  @Type(() => RelatedPersonDto) // Transform the relatedPerson object
  relatedPerson!: RelatedPersonDto | null;
}
