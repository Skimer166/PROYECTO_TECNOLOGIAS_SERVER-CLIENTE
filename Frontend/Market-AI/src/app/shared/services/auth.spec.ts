import { AuthService } from './auth';

describe('AuthService', () => {
  it('should create', () => {
    const http: any = {}; 
    const service = new AuthService(http);
    expect(service).toBeTruthy();
  });
});

