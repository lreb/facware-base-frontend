import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { mergeMap } from 'rxjs/operators';
import { OktaAuthService } from '@okta/okta-angular';
import { Observable, from } from 'rxjs';
import { AuthenticationService } from '../services/authentication/authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private oktaAuth: OktaAuthService,
    private authenticationService: AuthenticationService
    ) {
  }
  /**
   * handle web request to use the correct JWT and authenticate with the API
   * @param request request
   * @param next http handler
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (this.authenticationService.Jwt){


      const idToken = this.authenticationService.getUserToken();
      if (idToken) {
          const cloned = request.clone({
              headers: request.headers.set('Authorization',
                  'Bearer ' + idToken)
          });
          return next.handle(cloned);
      }
      else {
          return next.handle(request);
      }
    }
    else if (this.authenticationService.Okta){
      return this.isAuthenticated()
      .pipe(mergeMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return next.handle(request);
        }

        return this.getAccessToken()
          .pipe(
            mergeMap((accessToken) => {
              request = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${accessToken}`
                }
              });
              return next.handle(request);
            })
          );
      }));
    }
  }

  private isAuthenticated(): Observable<boolean> {
    const observableFromPromise =  from(this.oktaAuth.isAuthenticated());
    return observableFromPromise;
  }

  private getAccessToken(): Observable<string> {
    const observableFromPromise =  from(this.oktaAuth.getAccessToken());
    return observableFromPromise;
  }
}
