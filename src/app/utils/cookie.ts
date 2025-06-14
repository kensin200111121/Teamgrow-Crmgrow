import { environment } from '@environments/environment';

export const Cookie = {
  setWithDomain: function (name, value, domain) {
    const expires = '';

    const host = location.host;
    if (host.split('.').length === 1) {
      // no "." in a domain - it's localhost or something similar
      document.cookie = name + '=' + value + expires + '; path=/';
    } else {
      document.cookie =
        name + '=' + value + expires + '; path=/; domain=' + domain;

      // check if cookie was successfuly set to the given domain
      // (otherwise it was a Top-Level Domain)
      if (Cookie.get(name) == null || Cookie.get(name) != value) {
        document.cookie =
          name + '=' + value + expires + '; path=/; domain=' + domain;
      }
    }
  },
  set: function (name, value, days) {
    console.log('set cookie', location.host, document.cookie);
    let domain, domainParts, date, expires;

    if (days) {
      date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toGMTString();
    } else {
      expires = '';
    }

    const host = location.host;
    if (host.split('.').length === 1) {
      // no "." in a domain - it's localhost or something similar
      document.cookie = name + '=' + value + expires + '; path=/';
    } else {
      // Remember the cookie on all subdomains.
      //
      // Start with trying to set cookie to the top domain.
      // (example: if user is on foo.com, try to set
      //  cookie to domain ".com")
      //
      // If the cookie will not be set, it means ".com"
      // is a top level domain and we need to
      // set the cookie to ".foo.com"
      domainParts = host.split('.');
      domainParts.shift();
      domain = '.' + domainParts.join('.');

      document.cookie =
        name + '=' + value + expires + '; path=/; domain=' + domain;

      // check if cookie was successfuly set to the given domain
      // (otherwise it was a Top-Level Domain)
      if (Cookie.get(name) == null || Cookie.get(name) != value) {
        // append "." to current domain
        domain = '.' + host;
        document.cookie =
          name + '=' + value + expires + '; path=/; domain=' + domain;
      }
    }
  },
  get: function (name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  erase: function (name) {
    Cookie.set(name, '', -1);
  },

  setLogin: function (userId) {
    Cookie.set('userLogin' + location.host, 'logged', '');
    Cookie.set('domain', environment.domain.server, '');
    Cookie.set('userId', userId, '');
  },

  setLogout: function () {
    Cookie.set('userLogin' + location.host, 'out', '');
    Cookie.set('domain', environment.domain.server, '');
    Cookie.set('userId', '', '');
  }
};
