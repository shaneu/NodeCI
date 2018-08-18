const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('when logged in', () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a[href="/blogs/new"]');
  });

  test('should see blog create form', async () => {
    const label = await page.getContentsOf('form label');

    expect(label).toBe('Blog Title');
  });

  describe('when using valid inputs', () => {
    beforeEach(async () => {
      await page.type('.title input', 'This is a title');
      await page.type('.content input', 'This is some content');
      await page.click('form button');
    });

    test('should take user to a submit screen', async () => {
      const text = await page.getContentsOf('h5');

      expect(text).toBe('Please confirm your entries');
    });

    describe('when user saves a blog', () => {
      beforeEach(async () => {
        await page.click('button.green');
        await page.waitFor('.card');
      });

      test('should add blog to index page', async () => {
        const title = await page.getContentsOf('.card-title');
        const contents = await page.getContentsOf('.card p');

        expect(title).toBe('This is a title');
        expect(contents).toBe('This is some content');
      });
    });
  });

  describe('when using invalid inputs', () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('should show error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toBe('You must provide a value');
      expect(contentError).toBe('You must provide a value');
    });
  });
});

describe('when user is not logged in', () => {
  const actions = [
    {
      method: 'get',
      path: 'api/blogs',
    },
    {
      method: 'post',
      path: 'api/blogs',
      data: { title: 'T', content: 'C' },
    },
  ];

  test('should prohibit blog related activity', async () => {
    const results = await page.execRequests(actions);

    results.forEach(({ error }) => expect(error).toBe('You must log in!'));
  });
});
