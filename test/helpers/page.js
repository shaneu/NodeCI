const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/session-factory');
const userFactory = require('../factories/user-factory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get(target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const { session, sig } = sessionFactory(await userFactory());

    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) =>
        fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(_data),
        }).then(res => res.json()),
      path,
      data
    );
  }

  get(path) {
    return this.page.evaluate(
      _path =>
        fetch(_path, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'content-type': 'application/json',
          },
        }).then(res => res.json()),
      path
    );
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => this[method](path, data))
    );
  }
}

module.exports = CustomPage;
