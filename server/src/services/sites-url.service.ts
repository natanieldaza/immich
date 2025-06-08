import { BadRequestException, Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { SitesUrlCreateDto, SitesUrlResponseDto, SitesUrlUpdateDto } from 'src/dtos/sites-url.dto';
import { JobName, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';


@Injectable()
export class SitesUrlService extends BaseService {
    private intervalId: NodeJS.Timeout | null = null;
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
                posts: dto.posts ?? 0,
            });

            return {
                id: newSiteUrl.id ? String(newSiteUrl.id) : '',
                url: newSiteUrl.url,
                createdAt: newSiteUrl.createdAt ? new Date(String(newSiteUrl.createdAt)) : null,
                visitedAt: newSiteUrl.visitedAt ? new Date(String(newSiteUrl.visitedAt)) : null,
                preference: newSiteUrl.preference,
                description: newSiteUrl.description,
                posts: newSiteUrl.posts ?? 0,
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
            ...(updateSiteUrlDto.posts !== undefined && { posts: updateSiteUrlDto.posts }),
            ...(updateSiteUrlDto.visitedAt !== undefined && { visitedAt: updateSiteUrlDto.visitedAt }),
            ...(updateSiteUrlDto.runAt !== undefined && { runAt: updateSiteUrlDto.runAt }),
            ...(updateSiteUrlDto.failed !== undefined && { failed: updateSiteUrlDto.failed }),

        });

        if (!updatedSiteUrl) {
            throw new BadRequestException('Failed to update Site URL');
        }

        return updatedSiteUrl;
    }
    async setVisited(auth: AuthDto, id: string): Promise<SitesUrlResponseDto> {
        const updatedSiteUrl = await this.sitesUrlRepository.setVisited(id, new Date());
        if (!updatedSiteUrl) {
            throw new BadRequestException('Failed to set Site URL as visited');
        }
        return updatedSiteUrl;
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
            posts: siteUrl.posts ?? 0,
            runAt: siteUrl.runAt ? new Date(String(siteUrl.runAt)) : null,
            failed: siteUrl.failed ?? null,
            lastDownloadedNode: siteUrl.lastDownloadedNode ? String(siteUrl.lastDownloadedNode) : null,
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
            posts: siteUrl.posts ?? 0,
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
            posts: siteUrl.posts ?? 0,
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
            posts: deletedSiteUrl.posts ?? 0,
        };
    }
     // Run gallery-dl on a given URL, returns true if success, false otherwise
     async scrapeWithGalleryDl(url: string): Promise<[boolean, string | null]> {
        const cmd = ['gallery-dl', url, '--write-metadata', '--write-tags', '--verbose'];
      
        this.logger.log(`Running gallery-dl command: ${cmd.join(' ')}`);
      
        return new Promise((resolve) => {
          const process = spawn(cmd[0], cmd.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
      
          let lastDownloadedNode: string | null = null;
          let hadError = false;
      
          process.stdout.on('data', (data) => {
            this.logger.log(`[gallery-dl stdout] ${data.toString().trim()}`);
          });
      
          process.stderr.on('data', (data) => {
            const line = data.toString().trim();
            lastDownloadedNode = line.match(/Last downloaded node: (.+)/)?.[1] || lastDownloadedNode;
      
            // Check if it's a known error line
            if (/Traceback|Error|Exception|Unable to handle request/i.test(line)) {
              this.logger.error(`[gallery-dl stderr] ${line}`);
              hadError = true;
            } else {
              // Just debug/info output, not a real error
              this.logger.log(`[gallery-dl stderr] ${line}`);
            }
          });
      
          process.on('close', (code) => {
            if (code === 0 && !hadError) {
              this.logger.log(`gallery-dl completed successfully for URL: ${url}`);
              resolve([false, lastDownloadedNode]);
            } else {
              this.logger.error(`gallery-dl exited with code ${code} for URL: ${url}`);
              resolve([true, lastDownloadedNode]);
            }
          });
      
          process.on('error', (err) => {
            this.logger.error(`Failed to start gallery-dl: ${err.message}`);
            resolve([true, lastDownloadedNode]);
          });
        });
      }
      
    async runGalleryDlOnUrl(auth: AuthDto, url: string): Promise<[boolean, string | null]> {
        try {
            this.logger.log(`Running gallery-dl on URL: ${url}`);
            const [failed,lastDownloadedNode] = await this.scrapeWithGalleryDl(url);
            if (failed) {
                throw new BadRequestException(`gallery-dl failed for URL: ${url}`);
            }
            this.logger.log(`gallery-dl completed successfully for URL: ${url}`);
            return [false,lastDownloadedNode];
            
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error(`Error running gallery-dl on URL ${url}: ${error.message}`);
            } else {
                this.logger.error(`Error running gallery-dl on URL ${url}: ${String(error)}`);
            }
            throw new BadRequestException(`Failed to run gallery-dl on URL ${url}`);
        }
    }

    
    async runGalleryDl(auth: AuthDto, preference: number): Promise<void> {
        const siteUrls = await this.sitesUrlRepository.getAllByPreferenceSortedByPosts(preference);
        if (!siteUrls || siteUrls.length === 0) {
            this.logger.warn(`No Site URLs found with preference ${preference} to run gallery-dl on.`);
            return;
        }

        for (const siteUrl of siteUrls) {
            try {
                this.logger.log(`Processing URL: ${siteUrl.url}`);
                const [failed,lastDownloadedNode] = await this.scrapeWithGalleryDl(siteUrl.url);
                await this.sitesUrlRepository.setProcessed(siteUrl.id, new Date(), failed,lastDownloadedNode);
                if (failed) {
                    this.logger.error(`gallery-dl failed for URL: ${siteUrl.url}`);
                    
                    continue; // Skip to the next URL if gallery-dl failed
                }
                this.logger.log(`Successfully processed URL: ${siteUrl.url}`);

            } catch (error) {
                this.logger.error(`Error processing URL ${siteUrl.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                await this.sitesUrlRepository.setProcessed(siteUrl.id, new Date(), true, null);
            }
        }
    }
    async dowload(auth: AuthDto, id: string) {
        const siteUrl = await this.sitesUrlRepository.getById(id);
        if (!siteUrl) {
            throw new BadRequestException('Site URL not found');
        }
        if (!siteUrl.url) {
            throw new BadRequestException('Site URL is empty');
        }
        this.logger.log(`Starting download for Site URL: ${siteUrl.url}`);
        await this.jobRepository.queue({
            name: JobName.GALLERY_DOWNLOADER,
            data: {
                id: siteUrl.id,
                url: siteUrl.url,
            }
        });
        // Check if the URL is already processed
        /*const [failed,lastDownloadedNode] = await this.runGalleryDlOnUrl(auth, siteUrl.url);
        await this.sitesUrlRepository.setProcessed(siteUrl.id, new Date(), failed,lastDownloadedNode);
        if (failed) {
            throw new BadRequestException(`Failed to download content from URL: ${siteUrl.url}`);
        }
        return {
            id: siteUrl.id ? String(siteUrl.id) : '',
            url: siteUrl.url,
            createdAt: siteUrl.createdAt ? new Date(String(siteUrl.createdAt)) : null,
            visitedAt: siteUrl.visitedAt ? new Date(String(siteUrl.visitedAt)) : null,
            preference: siteUrl.preference,
            description: siteUrl.description,
            posts: siteUrl.posts ?? 0,
            runAt: new Date(),
            failed: false,
            lastDownloadedNode: lastDownloadedNode ? String(lastDownloadedNode) : null,
        };*/
    }

    async startDownload(auth: AuthDto, preference:number) {
        if (preference < 6) {
            await this.jobRepository.queue({
                name: JobName.QUEUE_GALLERY_DOWNLOADER,
                data: {
                    id: '', // No specific ID needed for this job
                    preference,
                }
            });
        } else {
            await this.jobRepository.queue({
                name: JobName.QUEUE_GALLERY_DOWNLOADER_PRIORITY,
                data: {
                    id: '', // No specific ID needed for this job
                    preference,
                }
            });
        }

      }
    
     async stopDownload(auth: AuthDto, preference: number) {
        if(preference < 6) {
            await this.jobRepository.stop(QueueName.GALLERY_DOWNLOADER_QUEUE);
        }
        else {
            await this.jobRepository.stop(QueueName.GALLERY_DOWNLOADER_PRIORITY_QUEUE);
        }
      }
        @OnJob({ name: JobName.QUEUE_GALLERY_DOWNLOADER, queue: QueueName.GALLERY_DOWNLOADER_QUEUE })
        async handleGalleryDownloaderJob(job: JobOf<JobName.QUEUE_GALLERY_DOWNLOADER>): Promise<void> {
            const preference = job.preference;
            if (typeof preference !== 'number') {
                this.logger.error(`Invalid preference type: ${typeof preference}. Expected a number.`);
                throw new BadRequestException('Invalid preference type. Expected a number.');
            }
            const siteUrls = await this.sitesUrlRepository.getAllByPreferenceSortedByPosts(preference);
            if (!siteUrls || siteUrls.length === 0) {
                this.logger.warn(`No Site URLs found with preference ${preference} to run gallery-dl on.`);
                return;
            }
            await this.jobRepository.queueAll(

                siteUrls.map((siteUrl) => ({
                    name: JobName.GALLERY_DOWNLOADER,
                    data: {
                        id: siteUrl.id,
                        url: siteUrl.url,
                    }
                }))
            );

            
            
        }
        @OnJob({ name: JobName.GALLERY_DOWNLOADER, queue: QueueName.GALLERY_DOWNLOADER_QUEUE })
        async handleGalleryDownloader(job: JobOf<JobName.GALLERY_DOWNLOADER>): Promise<void> {
            const { id, url } = job;
            if (!id || !url) {
                this.logger.error(`Invalid job data: id=${id}, url=${url}`);
                throw new BadRequestException('Invalid job data. Both id and url are required.');
            }
        
            try {
                this.logger.log(`Processing URL: ${url}`);
                const [failed,lastDownloadedNode] = await this.scrapeWithGalleryDl(url);
                await this.sitesUrlRepository.setProcessed(id, new Date(), failed,lastDownloadedNode);
                if (failed) {
                    this.logger.error(`gallery-dl failed for URL: ${url}`);
                    return; // Skip to the next URL if gallery-dl failed
                }
                this.logger.log(`Successfully processed URL: ${url}`);

            } catch (error) {
                this.logger.error(`Error processing URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                await this.sitesUrlRepository.setProcessed(id, new Date(), true, null);
            }
        }
              
        @OnJob({ name: JobName.QUEUE_GALLERY_DOWNLOADER_PRIORITY, queue: QueueName.GALLERY_DOWNLOADER_PRIORITY_QUEUE })
        async handleGalleryDownloaderPriorityJob(job: JobOf<JobName.QUEUE_GALLERY_DOWNLOADER_PRIORITY>): Promise<void> {
        const preference = job.preference;
        if (typeof preference !== 'number') {
            this.logger.error(`Invalid preference type: ${typeof preference}. Expected a number.`);
            throw new BadRequestException('Invalid preference type. Expected a number.');   
        }
        if( !Number.isInteger(preference) || preference < 6) {
            this.logger.error(`Invalid preference value: ${preference}. Expected an integer greater than or equal to 6.`);
            throw new BadRequestException('Invalid preference value. Expected an integer greater than or equal to 6.');
        }
        const siteUrls = await this.sitesUrlRepository.getAllByPreferenceSortedByPosts(preference);
        if (!siteUrls || siteUrls.length === 0) {
            this.logger.warn(`No Site URLs found with preference ${preference} to run gallery-dl on.`);
            return;
        }
        
        await this.jobRepository.queueAll(

            siteUrls.map((siteUrl) => ({
                name: JobName.GALLERY_DOWNLOADER_PRIORITY,
                data: {
                    id: siteUrl.id,
                    url: siteUrl.url,
                }
            }))
        );
    }

    @OnJob({ name: JobName.GALLERY_DOWNLOADER_PRIORITY, queue: QueueName.GALLERY_DOWNLOADER_PRIORITY_QUEUE })
    async handleGalleryDownloaderPriority(job: JobOf<JobName.GALLERY_DOWNLOADER_PRIORITY>): Promise<void> {
        const { id, url } = job;
        if (!id || !url) {
            this.logger.error(`Invalid job data: id=${id}, url=${url}`);
            throw new BadRequestException('Invalid job data. Both id and url are required.');
        }
    
        try {
            this.logger.log(`Processing URL: ${url}`);
            const [failed,lastDownloadedNode] = await this.scrapeWithGalleryDl(url);
            await this.sitesUrlRepository.setProcessed(id, new Date(), failed,lastDownloadedNode);
            if (failed) {
                this.logger.error(`gallery-dl failed for URL: ${url}`);
                return; // Skip to the next URL if gallery-dl failed
            }
            this.logger.log(`Successfully processed URL: ${url}`);

        } catch (error) {
            this.logger.error(`Error processing URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            await this.sitesUrlRepository.setProcessed(id, new Date(), true, null);
        }
    }
}
