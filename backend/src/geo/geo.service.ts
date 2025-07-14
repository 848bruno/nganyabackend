// src/geo/geo.service.ts

import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

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
}
