import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { Mutex } from "async-mutex"; // Mutex to prevent concurrent requests
import { WebDataRepository } from "src/repositories/webdata.repository";

class InstagramUserProfile {
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
    public edgeProfiles: any[] = []
  ) {}

  static fromUserData(userData: any): InstagramUserProfile {
    return new InstagramUserProfile(
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
      userData.edge_related_profiles?.edges || []
    );
  }
}

@Injectable()
export class WebDataService {
  private readonly logger = new Logger(WebDataService.name);
  private readonly client: AxiosInstance;
  private readonly mutex = new Mutex(); // Mutex to prevent concurrent requests
  private readonly requestDelay = 2000; // Delay in milliseconds (2 seconds)

  constructor(private readonly webDataRepository: WebDataRepository) {
    this.client = axios.create({
      headers: {
        "x-ig-app-id": "936619743392459",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "*/*",
      },
    });
  }

  /**
   * Adds a delay before proceeding to the next request.
   * @param ms - Milliseconds to wait
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Scrapes a single Instagram user's public profile.
   * Uses a mutex to ensure requests are processed **one at a time**.
   * Adds a **delay** between each request to prevent rate limiting.
   * @param username - The Instagram username to scrape.
   * @returns The user's profile data or null if not found.
   */
  async scrapeUser(username: string): Promise<InstagramUserProfile | null> {
    return this.mutex.runExclusive(async () => {
      const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

      this.logger.log(`Scraping user: ${username}...`);
      this.logger.debug(`URL: ${url}`);

      try {
        const response = await this.client.get(url, { timeout: 10000 });

        if (!response.data?.data?.user) {
          this.logger.warn(`No user data found for ${username}`);
          return null;
        }

        const userProfile = InstagramUserProfile.fromUserData(response.data.data.user);
        this.logger.log(`Successfully scraped: ${username}`);

        // Delay before allowing the next request
        this.logger.log(`Waiting ${this.requestDelay / 1000} seconds before the next request...`);
        await this.delay(this.requestDelay);

        return userProfile;
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          this.logger.error(
            `HTTP Error (${error.response?.status}): ${JSON.stringify(error.response?.data)}`
          );
        } else {
          this.logger.error("Unexpected Error:", error);
        }
        return null;
      }
    });
  }
}
