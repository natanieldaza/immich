import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { SitesUrlCreateDto, SitesUrlResponseDto, SitesUrlUpdateDto } from 'src/dtos/sites-url.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SitesUrlService extends BaseService {
    async create(auth: AuthDto, dto: SitesUrlCreateDto): Promise<SitesUrlResponseDto> {
        try {
            if (!dto.url) {
                throw new BadRequestException('URL is required.');
            }
            const social_media = await this.socialMediaRepository.findbyUrl(dto.url);
            if (social_media) {
                throw new BadRequestException('A record with the same URL already exists in social media.');
            }

            const newSiteUrl = await this.sitesUrlRepository.insert(auth, {
                url: String(dto.url),
                createdAt: dto.createdAt ?? new Date(),
                visitedAt: null,
                preference: dto.preference ?? null,
                description: dto.description,
                
            });

            return {
                id: newSiteUrl.id ? String(newSiteUrl.id) : '',
                url: newSiteUrl.url,
                createdAt: newSiteUrl.createdAt ? new Date(String(newSiteUrl.createdAt)) : null,
                visitedAt: newSiteUrl.visitedAt ? new Date(String(newSiteUrl.visitedAt)) : null,
                preference: newSiteUrl.preference,
                description: newSiteUrl.description,
            };
        } catch (error) {
            if (error instanceof Error && error.message.includes('A record with the same URL already exists.')) {
                throw new BadRequestException('A site with the same URL already exists.');
            }
            throw error;
        }
    }


    async update(
        auth: AuthDto,
        id: string,
        updateSiteUrlDto: Partial<SitesUrlUpdateDto>
    ): Promise<SitesUrlResponseDto> {
        const updatedSiteUrl = await this.sitesUrlRepository.update(auth,id, {
            ...(updateSiteUrlDto.url !== undefined && { url: String(updateSiteUrlDto.url) }),
            ...(updateSiteUrlDto.preference !== undefined && { preference: updateSiteUrlDto.preference }),
            ...(updateSiteUrlDto.description !== undefined && { description: updateSiteUrlDto.description }),
        });

        if (!updatedSiteUrl) {
            throw new BadRequestException('Failed to update Site URL');
        }

        return {
            id: updatedSiteUrl.id ? String(updatedSiteUrl.id) : '',
            url: updatedSiteUrl.url,
            createdAt: updatedSiteUrl.createdAt ? new Date(String(updatedSiteUrl.createdAt)) : null,
            visitedAt: updatedSiteUrl.visitedAt ? new Date(String(updatedSiteUrl.visitedAt)) : null,
            preference: updatedSiteUrl.preference,
            description: updatedSiteUrl.description,
        };
    }
    async setVisited(auth: AuthDto, id: string): Promise<SitesUrlResponseDto> {
        const updatedSiteUrl = await this.sitesUrlRepository.update(auth,id, {
            visitedAt: new Date(),
        });
        if (!updatedSiteUrl) {
            throw new BadRequestException('Failed to update Site URL');
        }
        return {
            id: updatedSiteUrl.id ? String(updatedSiteUrl.id) : '',
            url: updatedSiteUrl.url,
            createdAt: updatedSiteUrl.createdAt ? new Date(String(updatedSiteUrl.createdAt)) : null,
            visitedAt: updatedSiteUrl.visitedAt ? new Date(String(updatedSiteUrl.visitedAt)) : null,
            preference: updatedSiteUrl.preference,
            description: updatedSiteUrl.description,
        };
    }
    async getAll(auth: AuthDto): Promise<SitesUrlResponseDto[]> {
        const siteUrls = await this.sitesUrlRepository.getAll();
        if (!siteUrls) {
            throw new BadRequestException('No Site URLs found');
        }
        return siteUrls.map((siteUrl) => ({
            id: siteUrl.id ? String(siteUrl.id) : '',
            url: siteUrl.url,
            createdAt: siteUrl.createdAt ? new Date(String(siteUrl.createdAt)) : null,
            visitedAt: siteUrl.visitedAt ? new Date(String(siteUrl.visitedAt)) : null,
            preference: siteUrl.preference,
            description: siteUrl.description,
        }));
        
    }
    async getById(auth: AuthDto, id: string): Promise<SitesUrlResponseDto> {
        const siteUrl = await this.sitesUrlRepository.getById(id);
        if (!siteUrl) {
            throw new BadRequestException('Site URL not found');
        }
        return {
            id: siteUrl.id ? String(siteUrl.id) : '',
            url: siteUrl.url,
            createdAt: siteUrl.createdAt ? new Date(String(siteUrl.createdAt)) : null,
            visitedAt: siteUrl.visitedAt ? new Date(String(siteUrl.visitedAt)) : null,
            preference: siteUrl.preference,
            description: siteUrl.description,
        }
    }
    async getByUrl(auth: AuthDto, url: string): Promise<SitesUrlResponseDto> {
        const siteUrl = await this.sitesUrlRepository.getByUrl(url);
        if (!siteUrl) {
            throw new BadRequestException('Site URL not found');
        }
        return {
            id: siteUrl.id ? String(siteUrl.id) : '',
            url: siteUrl.url,
            createdAt: siteUrl.createdAt ? new Date(String(siteUrl.createdAt)) : null,
            visitedAt: siteUrl.visitedAt ? new Date(String(siteUrl.visitedAt)) : null,
            preference: siteUrl.preference,
            description: siteUrl.description,
        }
    }
    async delete(auth: AuthDto, id: string): Promise<SitesUrlResponseDto> {
        const deletedSiteUrl = await this.sitesUrlRepository.delete(id);
        if (!deletedSiteUrl) {
            throw new BadRequestException('Site URL not found');
        }
        return {
            id: deletedSiteUrl.id ? String(deletedSiteUrl.id) : '',
            url: deletedSiteUrl.url,
            createdAt: deletedSiteUrl.createdAt ? new Date(String(deletedSiteUrl.createdAt)) : null,
            visitedAt: deletedSiteUrl.visitedAt ? new Date(String(deletedSiteUrl.visitedAt)) : null,
            preference: deletedSiteUrl.preference,
            description: deletedSiteUrl.description,
        };
    }

}
