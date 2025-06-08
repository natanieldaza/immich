 // sites-url.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
 
 export class SitesUrlCreateDto {
   @ApiProperty({ required: true })  
   @IsString()
   url!: string;
 
   @ApiProperty({ required: false,default:0})
   @IsNumber()
   @IsOptional()
   preference!: number ;
 
   @ApiProperty({ required: false, nullable: true })
   @IsString()
   @IsOptional()
   description!: string | null;
 
   @ApiProperty({ type: Date, default: () => new Date() })
   @Type(() => Date)
   @IsDate()
   @IsOptional()
   createdAt!: Date | null;
 
   @ApiProperty({ type: Date, required: false })
   @Type(() => Date)
   @IsDate()
   @IsOptional()
   visitedAt?: Date | null;

   @ApiProperty({ required: false, default: 0 })
   @IsNumber()
   @IsOptional()
   posts!: number;
   
 }
 
 
 export class SitesUrlResponseDto {
   @ApiProperty()
   @IsString()
   id!: string;
 
   @ApiProperty()
   @IsString()
   url!: string;
 
   @ApiProperty({ type: Date })
   @Type(() => Date)
   @IsDate()
   createdAt!: Date | null;
 
   @ApiProperty({ type: Date, required: false })
   @Type(() => Date)
   @IsDate()
   @IsOptional()
   visitedAt?: Date | null;
 
   @ApiProperty({ required: false, default: 0 })
   @IsNumber()
   @IsOptional()
   preference?: number ;
 
   @ApiProperty({ required: false, nullable: true })
   @IsString()
   @IsOptional()
   description!: string | null;

    @ApiProperty({ required: false, default: 0 })
    @IsNumber()
    @IsOptional()
    posts!: number;

    @ApiProperty({ type: Date, required: false })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    runAt?: Date | null;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    failed?: boolean | null;  
    
    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    lastDownloadedNode?: string | null;
 }
 
 export class SitesUrlUpdateDto {
 
   @ApiProperty({ required: false, nullable: true })
   @IsString()
   @IsOptional()
   url?: string;
 
   @ApiProperty({ required: false, default: 0 })
   @IsNumber()
   @IsOptional()
   preference?: number;
 
   @ApiProperty({ required: false, nullable: true })
   @IsString()
   @IsOptional()
   description!: string | null;
 
   @ApiProperty({ type: Date, required: false })
   @Type(() => Date)
   @IsDate()
   @IsOptional()
   visitedAt?: Date | null;

    @ApiProperty({ required: false, default: 0 })
    @IsNumber()
    @IsOptional()
    posts?: number;
    
    @ApiProperty({ type: Date, required: false })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    runAt?: Date | null;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    failed?: boolean | null;  

    @ApiProperty({ required: false, nullable: true })
    @IsString()
    @IsOptional()
    lastDownloadedNode?: string | null;
 }

 export class SitesUrlDownloadDto {
   @ApiProperty({ required: true })
   @IsString()
   url!: string;
  
   @ApiProperty({ type: Date, required: false })
   @Type(() => Date)
   @IsDate()
   @IsOptional()
   runAt?: Date | null;

   @ApiProperty({ required: false, default: false })
   @IsOptional()
   failed?: boolean | null;  

   @ApiProperty({ required: false, nullable: true })
   @IsString()
   @IsOptional()
   lastDownloadedNode?: string | null;
}