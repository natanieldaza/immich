import { Injectable } from '@nestjs/common';
import fs from 'fs';

import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

import { SocialMedia } from 'src/db';

interface InstagramGeolocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

@Injectable()
export class WebDataScrappingRepository {

  private socialMedia = new Map<string, SocialMedia>();

  private location = new Map<number, InstagramGeolocation[]>();

  getSocialMedia(): Map<string, SocialMedia> {
    return this.socialMedia;
  }

  getLocation(): Map<number, InstagramGeolocation[]> {
    return this.location;
  }

  addPerson(socialMedia: SocialMedia): void {
    this.socialMedia.set( socialMedia.platformUserId?? '', socialMedia);
  }

  addLocation(locationId: number, location: InstagramGeolocation[]): void {
    this
      .location
      .set(locationId, location);
  }


  constructor(private configRepository: ConfigRepository, private logger: LoggingRepository) {
    const env = this.configRepository.getEnv();
    this.logger.setContext('WebDataRepository');
  }

  private get cookieFilePath(): string {

    const env = this.configRepository.getEnv();
    this.logger.log(`Cookies path: ${env.cookies_path}`);

    if (env.cookies_path == '') {
      return '';
    }
    return `${env.cookies_path}/www.instagram.com_cookies.txt`;
  }

  getSessionId(): string | null {
    if (!fs.existsSync(this.cookieFilePath)) {
      console.error('Cookie file not found. Export cookies and save them properly.');
      return null;
    }
    else {
      process.stdout.write('Cookie file found ' + this.cookieFilePath + '\n');
    }

    try {
      const cookieData = fs.readFileSync(this.cookieFilePath, 'utf8').trim();
      const lines = cookieData.split('\n');

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 7 && parts[5] === 'sessionid') {
          process.stdout.write('Session ID found ' + parts[6] + '\n');
          return parts[6];
        }
      }

      console.error('Session ID not found in cookie file.');
      return null;
    } catch (error) {
      console.error('Error reading cookie file:', error);
      return null;
    }
  }

}