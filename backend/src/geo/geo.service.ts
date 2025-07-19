import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { User } from 'src/users/entities/user.entity'; // Import User entity for typing

@Injectable()
export class LocationService {
  private readonly OSRM_URL = 'http://router.project-osrm.org';
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  constructor(private readonly httpService: HttpService) {}

  // Geocode an address using Nominatim
  async geocode(address: string): Promise<{ lat: number; lon: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.NOMINATIM_URL, {
          params: {
            q: address,
            format: 'json',
            limit: 1,
            'accept-language': 'en',
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'MyRideSharingApp/1.0', // required by Nominatim policy
          },
        }),
      );

      if (!response.data?.length) {
        throw new Error('Address not found');
      }

      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
      };
    } catch (error) {
      throw new InternalServerErrorException('Geocoding failed: ' + error.message);
    }
  }

  // Get route between two coordinates using OSRM
  async getRoute(start: [number, number], end: [number, number]) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.OSRM_URL}/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}`,
          {
            params: {
              overview: 'full',
              geometries: 'geojson',
              steps: true,
            },
          },
        ),
      );

      if (response.data.code !== 'Ok') {
        throw new Error('Routing failed: ' + response.data.message);
      }

      return response.data.routes[0];
    } catch (error) {
      throw new InternalServerErrorException('Routing failed: ' + error.message);
    }
  }

  /**
   * Calculates the Haversine distance between two sets of coordinates in kilometers.
   * @param lat1 Latitude of point 1.
   * @param lon1 Longitude of point 1.
   * @param lat2 Latitude of point 2.
   * @param lon2 Longitude of point 2.
   * @returns Distance in kilometers.
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Filters and sorts a list of drivers based on their proximity to an origin point.
   * This method assumes the input `drivers` array already contains users with `currentLatitude` and `currentLongitude`.
   * @param originLat Latitude of the origin.
   * @param originLon Longitude of the origin.
   * @param drivers An array of User entities (drivers) to filter and sort.
   * @param maxDistanceKm Maximum distance in kilometers to search for drivers.
   * @param limit Maximum number of drivers to return.
   * @returns An array of User entities (drivers), with calculated distance, sorted by distance.
   */
  findNearestDrivers(
    originLat: number,
    originLon: number,
    drivers: User[], // Expects an array of User objects
    maxDistanceKm: number = 5,
    limit: number = 5,
  ): (User & { distance?: number })[] {
    if (!drivers || drivers.length === 0) {
      return [];
    }

    const driversWithDistance = drivers
      .map((driver) => {
        if (driver.currentLatitude === null || driver.currentLongitude === null) {
          return null; // Skip drivers without valid coordinates
        }
        const distance = this.calculateHaversineDistance(
          originLat,
          originLon,
          driver.currentLatitude,
          driver.currentLongitude,
        );
        return { ...driver, distance };
      })
      .filter(Boolean) as (User & { distance: number })[]; // Filter out nulls and assert type

    const filteredAndSortedDrivers = driversWithDistance
      .filter((driver) => driver.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return filteredAndSortedDrivers;
  }
}
