import request = require('request');

export async function makeRequest(params: any): Promise<request.Response> {
  return new Promise<any>((resolve, reject) => {
    request(params, (err: any, res: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(res);
    });
  });
}
