import { Injectable } from "@nestjs/common";
import { Mutex } from "async-mutex";
import axios, { AxiosInstance } from "axios";
import * as puppeteer from "puppeteer";
import { OnJob } from "src/decorators";
import { JobName, JobStatus, QueueName } from "src/enum";
import { BaseService } from "src/services/base.service";
import { JobOf } from "src/types";

class SocialMediaProfile {
  constructor(
    public id: string,
    public username: string,
    public fullName: string,
    public bio: string,
    public profilePicUrl: string,
    public isPrivate: boolean,
    public isVerified: boolean,
    public followerCount: number,
    public followingCount: number,
    public totalPosts: number,
    public platform: string,
    public edgeProfiles: any[] = []
  ) { }

  static fromPlatformData(userData: any, platform: string): SocialMediaProfile {
    switch (platform.toLowerCase()) {
      case "instagram":
        return new SocialMediaProfile(
          userData.id,
          userData.username,
          userData.full_name,
          userData.biography || "",
          userData.profile_pic_url_hd || userData.profile_pic_url || "",
          userData.is_private,
          userData.is_verified,
          userData.edge_followed_by?.count || 0,
          userData.edge_follow?.count || 0,
          userData.edge_owner_to_timeline_media?.count || 0,
          "instagram",
          userData.edge_related_profiles?.edges || []
        );
      case "tiktok":
      case "facebook":
      case "twitter":
        return new SocialMediaProfile(
          userData.id,
          userData.username,
          userData.name || "",
          userData.description || "",
          userData.profile_image_url || "",
          false,
          userData.verified || false,
          userData.followers_count || 0,
          userData.friends_count || 0,
          userData.statuses_count || 0,
          platform,
          []
        );
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

@Injectable()
export class WebDataScrappingService extends BaseService {
  private readonly mutex = new Mutex();
  private readonly maxRetries = 5;
  private readonly baseDelay = 2000;
  private readonly jitterFactor = 0.5;

  private readonly userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.89 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.96 Safari/537.36",
  ];

  private readonly clients: Record<string, AxiosInstance> = {
    instagram: axios.create({
      headers: {
        //for instagram you need to add the x-ig-app-id header
        "x-ig-app-id": "936619743392459",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "*/*",
      },
    }),
    twitter: axios.create({
      headers: {
        "Authorization": "Bearer YOUR_TWITTER_API_KEY",

      },
    }),
    tiktok: axios.create({
      headers: {

      },
    }),
    facebook: axios.create({
      headers: {
        "Authorization": "Bearer YOUR_FACEBOOK_ACCESS_TOKEN",
      },
    }),
  };

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrapeUser(username: string, platform: string): Promise<SocialMediaProfile | null> {
    return this.mutex.runExclusive(async () => {
      const url = this.getPlatformApiUrl(username, platform);
      if (!url) {
        this.logger.warn(`Unsupported platform: ${platform}`);
        return null;
      }

      let attempts = 0;
      while (attempts < this.maxRetries) {
        try {
          const client = this.clients[platform.toLowerCase()];
          const response = await client.get(url, {
            timeout: 10000,
            headers: { "User-Agent": this.getRandomUserAgent() },
          });

          if (!response.data) return null;
          return SocialMediaProfile.fromPlatformData(response.data, platform);
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            // Instagram errors
            if (status === 429) {
              const retryAfter = error.response?.headers["retry-after"];
              const delayTime = this.calculateBackoff(attempts, retryAfter);
              this.logger.warn(`Rate limited (429) for ${username} on ${platform}. Retrying in ${delayTime / 1000}s...`);
              await this.delay(delayTime);
            } else if (status === 403) {
              this.logger.error(`Blocked (403) for ${username} on ${platform}.`);
              return null;
            } else if (status === 404) {
              this.logger.warn(`User not found (404) on ${platform}: ${username}`);
              return null;
            } else if (status !== undefined && status >= 500) {
              this.logger.warn(`Server error (${status}) on ${platform} for ${username}. Retrying...`);
            } else {
              this.handleRequestError(error, username, url);
              return null;
            }
          } else {
            this.logger.error(`Unexpected error scraping ${username} on ${platform}:`, error);
          }
        }
        attempts++;
      }
      return null;
    });
  }

  private getPlatformApiUrl(username: string, platform: string): string | null {
    switch (platform.toLowerCase()) {
      case "instagram":
        return `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
      case "tiktok":
        return `https://www.tiktok.com/api/user/detail/?uniqueId=${username}`;
      case "twitter":
        return `https://api.twitter.com/2/users/by/username/${username}`;
      case "facebook":
        return `https://graph.facebook.com/${username}?fields=id,name,picture,followers_count`;
      default:
        return null;
    }
  }

  private calculateBackoff(attempt: number, retryAfter?: string): number {
    if (retryAfter) return parseInt(retryAfter, 10) * 1000 || this.baseDelay;
    return this.baseDelay * Math.pow(2, attempt) + (this.baseDelay * this.jitterFactor * Math.random());
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleRequestError(error: any, username: string, url: string): void {
    this.logger.error(`Error scraping ${username} on ${url}:`, error);
  }

  @OnJob({ name: JobName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB, queue: QueueName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB })
  async handleSocialMediaDataScrapingWeb(job: JobOf<JobName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB>): Promise<JobStatus> {
    const { socialMediaId, platform } = job;
    const userProfile = await this.scrapeUser(socialMediaId, platform);
    if (!userProfile) return JobStatus.FAILED;
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LOCATION_DATA_SCRAPPING_WEB, queue: QueueName.LOCATION_DATA_SCRAPPING_WEB })
  async handleLocationDataScrapingWeb(job: JobOf<JobName.LOCATION_DATA_SCRAPPING_WEB>): Promise<JobStatus> {
    if (job.locationName) {

      const locationCoordinates = await this.getCoordinates(job.locationName);
      if (locationCoordinates) {
        const locationData = {
          name: locationCoordinates.name,
          platformLocationId: job.locationId,
          latitude: locationCoordinates.lat,
          longitude: locationCoordinates.lon,
          platform: 'instagram',
        };
        await this.geodataPlacesRepository.updatePlace(locationData);
        return JobStatus.SUCCESS;
      }
    }


    const browser = await puppeteer.launch({
      headless: true, // Run headless to reduce detection
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Prevents permission issues
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const locationId = job.locationId;
      const url = `https://www.instagram.com/explore/locations/${locationId}/`;

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Extract geolocation data
      const geoData = await page.evaluate(() => {
        try {
          const scriptTag = Array.from(document.querySelectorAll('script[type="application/json"]'))
            .find(script => script.textContent?.includes('xdt_location_get_web_info'));

          if (!scriptTag) return null;

          // Parse JSON content
          const jsonData = JSON.parse(scriptTag.textContent || '{}');
          const locationInfo = jsonData?.require?.[0]?.[3]?.[0]?.__bbox?.result?.data?.xdt_location_get_web_info?.native_location_data?.location_info;

          if (!locationInfo) return null;

          this.logger.debug(`Location Info: ${JSON.stringify(locationInfo)}`);

          return {
            name: locationInfo.name,
            platformLocationId: locationInfo.location_id,  // Make sure 'id' is the correct field
            latitude: locationInfo.lat,
            longitude: locationInfo.lng,
            platform: 'instagram',

          };
        } catch (error) {
          return null;
        }
      });

      if (!geoData) {
        this.logger.warn(`Failed to fetch geolocation data for locationId: ${locationId}`);
        return JobStatus.FAILED;
      }

      await this.geodataPlacesRepository.updatePlace(geoData);  // Ensure this is awaited properly

      this.logger.debug(`Location Geolocation Data for ${locationId}: ${JSON.stringify(geoData)}`);

      return JobStatus.SUCCESS;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error scraping location data for locationId: ${job.locationId}. Error: ${error.message}`);
      } else {
        this.logger.error(`Error scraping location data for locationId: ${job.locationId}. Error: ${String(error)}`);
      }
      return JobStatus.FAILED;
    } finally {
      await browser.close();
    }
  }
  @OnJob({ name: JobName.QUEUE_SOCIAL_MEDIA_DATA_SCRAPPING_WEB, queue: QueueName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB })
  async handleQueueSocialMediaDataScraping(job: JobOf<JobName.QUEUE_SOCIAL_MEDIA_DATA_SCRAPPING_WEB>): Promise<JobStatus> {
    const { force } = job;

    // Fetch all social media profiles from database that are not fully scraped
    // const socialMediaHub = [];

    // if (socialMediaHub.size === 0) {
    //   this.logger.warn('No social media data available for scraping. Skipping job.');
    //   return JobStatus.SKIPPED;
    // }

    // for (const [key, socialMedia] of socialMediaHub) {
    //   this.logger.debug(`Processing social media profile: ${key}`);
    //   // Verify missing data
    //   const missingFields = [];
    //   if (!socialMedia.name) missingFields.push('name');
    //   if (!socialMedia.platformUserId) missingFields.push('platformUserId');
    //   if (!socialMedia.platformUserIdHash) missingFields.push('platformUserIdHash');
    //   if (!socialMedia.description) missingFields.push('description');
    //   if (socialMedia.followers === 0) missingFields.push('0');
    //   if (socialMedia.following === 0) missingFields.push('0');
    //   if (socialMedia.posts === 0) missingFields.push('0');
    //   if (missingFields.length > 0) {
    //     const socialMediaId = socialMedia.platformUserId;
    //     const hashId = socialMedia.platformUserIdHash;
    //     const platform = socialMedia.platform;
    //     await this.jobRepository.queue({
    //       name: JobName.SOCIAL_MEDIA_DATA_SCRAPPING_WEB,
    //       data: { socialMediaId, hashId, platform }
    //     });
    //   }
    // }


    return JobStatus.SUCCESS;
  }
  @OnJob({ name: JobName.QUEUE_LOCATION_DATA_SCRAPPING_WEB, queue: QueueName.LOCATION_DATA_SCRAPPING_WEB })
  async handleQueueMetadataExtraction(job: JobOf<JobName.QUEUE_LOCATION_DATA_SCRAPPING_WEB>): Promise<JobStatus> {
    const { force } = job;

    // Fetch all location IDs from database that are not fully scraped
    const locations = await this.geodataPlacesRepository.getallUnscrappedLocations();

    if (locations.length === 0) {
      this.logger.warn('No location data available for scraping. Skipping job.');
      return JobStatus.SKIPPED;
    }

    for (const location of locations) {
      this.logger.debug(`Processing location ID: ${location.platformLocationId}`);
      // Verify missing data
      const missingFields = [];
      if (!location.latitude) missingFields.push('latitude');
      if (!location.longitude) missingFields.push('longitude');
      if (missingFields.length > 0) {
        const locationId = location.platformLocationId;
        const locationName = location.name;
        await this.jobRepository.queue({
          name: JobName.LOCATION_DATA_SCRAPPING_WEB,
          data: { locationId, locationName }
        });
      }
    }
    //getCoordinates


    return JobStatus.SUCCESS;
  }



  // === 1. Try Nominatim ===
  async tryNominatim(locationName: string) {
    const headers = {
      'User-Agent': 'YourAppName/1.0 (you@example.com)' // Required by OSM
    };
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationName,
          format: 'json',
          limit: 1
        },
        headers
      });

      if (response.data.length > 0) {
        const place = response.data[0];
        return {
          source: 'nominatim',
          name: place.display_name,
          lat: Number.parseFloat(place.lat),
          lon: Number.parseFloat(place.lon)
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Nominatim failed:', error.message);
      } else {
        console.warn('Nominatim failed with an unknown error:', error);
      }
    }

    return null;
  }

  // === 2. Try GeoNames ===
  async tryGeoNames(locationName: string) {
    const username = process.env.GEONAMES_USERNAME;
    if (!username) return null;

    try {
      const response = await axios.get('http://api.geonames.org/searchJSON', {
        params: {
          q: locationName,
          maxRows: 1,
          username
        }
      });

      if (response.data.geonames?.length > 0) {
        const place = response.data.geonames[0];
        return {
          source: 'geonames',
          name: place.name,
          lat: Number.parseFloat(place.lat),
          lon: Number.parseFloat(place.lng)
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('GeoNames failed:', error.message);
      } else {
        console.warn('GeoNames failed with an unknown error:', error);
      }
    }

    return null;
  }

  // === 3. Try OpenCage ===
  async tryOpenCage(locationName: string) {
    const key = process.env.OPENCAGE_API_KEY;
    if (!key) return null;

    try {
      const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: locationName,
          key,
          limit: 1
        }
      });

      const result = response.data?.results?.[0];
      if (result) {
        return {
          source: 'opencage',
          name: result.formatted,
          lat: result.geometry.lat,
          lon: result.geometry.lng
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('OpenCage failed:', error.message);
      } else {
        console.warn('OpenCage failed with an unknown error:', error);
      }
    }

    return null;
  }

  // === 4. Try Google Maps ===
  async tryGoogleMaps(locationName: string) {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return null;

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: locationName,
          key
        }
      });

      const result = response.data?.results?.[0];
      if (result) {
        return {
          source: 'google',
          name: result.formatted_address,
          lat: result.geometry.location.lat,
          lon: result.geometry.location.lng
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn('Google Maps failed:', error.message);
      } else {
        console.warn('Google Maps failed with an unknown error:', error);
      }
    }

    return null;
  }

  // === Master function ===
  async getCoordinates(locationName: string) {
    const methods = [
      this.tryNominatim,
      this.tryGeoNames,
      this.tryOpenCage,
      this.tryGoogleMaps
    ];

    for (const method of methods) {
      const result = await method(locationName);
      if (result) return result;
    }

    return null;
  }

  // === Example usage ===
  // getCoordinates('Tokyo Tower').then(result => {
  //   if (result) {
  //     console.log(`✅ Found via ${result.source}:`, result);
  //   } else {
  //     console.log('❌ Location not found.');
  //   }
  // });

}
// How to get Instagram username from user ID?
// To get the public username from Instagram's private user ID we can take advantage of public iPhone API https://i.instagram.com/api/v1/users/<USER_ID>/info/:
// import httpx
// iphone_api = "https://i.instagram.com/api/v1/users/{}/info/"
// iphone_user_agent = "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_3 like Mac OS X) AppleWebKit/603.3.8 (KHTML, like Gecko) Mobile/14G60 Instagram 12.0.0.16.90 (iPhone9,4; iOS 10_3_3; en_US; en-US; scale=2.61; gamut=wide; 1080x1920"
// resp = httpx.get(iphone_api.format("1067259270"), headers={"User-Agent": iphone_user_agent})
// print(resp.json()['user']['username'])
