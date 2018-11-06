import { makeRequest } from './request-helper';

export async function getVin(auth_header: string): Promise<string> {
  const response = await makeRequest({
    url: 'https://service-provider-gateway.machinetohuman.com/v1/vin',
    method: 'GET',
    headers: { Authorization: auth_header, 'Content-Type': 'application/json' },
  });
  return response.body;
}
