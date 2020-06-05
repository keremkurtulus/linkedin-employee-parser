const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const cheerio = require("cheerio");
const { info, autoScroll } = require("./utils");

class Parser {
  browser = null;
  sessionCookieValue = null;
  timeout = 10000;

  constructor({ sessionCookieValue = "" } = {}) {
    this.sessionCookieValue = sessionCookieValue;
  }

  // Inıtial setup for puppeteer
  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "---single-process",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--proxy-server='direct://",
          "--proxy-bypass-list=*",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-features=site-per-process",
          "--enable-features=NetworkService",
          "--allow-running-insecure-content",
          "--enable-automation",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-web-security",
          "--autoplay-policy=user-gesture-required",
          "--disable-background-networking",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-component-update",
          "--disable-default-apps",
          "--disable-domain-reliability",
          "--disable-extensions",
          "--disable-features=AudioServiceOutOfProcess",
          "--disable-hang-monitor",
          "--disable-ipc-flooding-protection",
          "--disable-notifications",
          "--disable-offer-store-unmasked-wallet-cards",
          "--disable-popup-blocking",
          "--disable-print-preview",
          "--disable-prompt-on-repost",
          "--disable-speech-api",
          "--disable-sync",
          "--disk-cache-size=33554432",
          "--hide-scrollbars",
          "--ignore-gpu-blacklist",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-default-browser-check",
          "--no-first-run",
          "--no-pings",
          "--no-zygote",
          "--password-store=basic",
          "--use-gl=swiftshader",
          "--use-mock-keychain",
        ],
        timeout: this.timeout,
      });
      info("Puppeteer is initialized.");

      await this.isLoggedIn();
    } catch (error) {
      this.close();
      throw error;
    }
  }

  async isLoggedIn() {
    try {
      const page = await this.newPage();

      await page.goto("https://www.linkedin.com/login", {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      const url = page.url();

      const isLoggedIn = !url.endsWith("/login");

      await page.close();

      if (isLoggedIn) {
        info("Logged in succesfully.");
      } else {
        let message =
          "Session has expired. Please update your session cookie value.";
        info(message);
        throw new Error(message);
      }
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  async newPage() {
    try {
      if (!this.browser) {
        throw new Error("Browser is not found.");
      }

      // New page is created
      const page = await this.browser.newPage();

      // Working on a single tab
      const tabs = await this.browser.pages();
      if (tabs.length > 1) {
        await tabs[0].close();
      }

      info("New page is created.");

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      );
      await page.setViewport({
        width: 1200,
        height: 720,
      });

      await page.setCookie({
        name: "li_at",
        value: this.sessionCookieValue,
        domain: ".www.linkedin.com",
      });

      return page;
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  async close(page = null) {
    if (page) {
      try {
        await page.close();
        info("Page is closed.");
      } catch (err) {}
    }

    if (this.browser) {
      try {
        await this.browser.close();
        info("Browser is closed.");
      } catch (err) {}
    }
  }

  async getPeopleList(company) {
    try {
      const page = await this.newPage();

      await page.goto(company.url, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      await page.waitFor(500);

      // check linkedin url is valid or not
      try {
        await page.waitForSelector(
          'a[data-control-name="topcard_see_all_employees"]',
          { timeout: this.timeout }
        );
      } catch (error) {
        info("The linkedin url for " + company.name + " is not valid", 'error');
        return [];
      }

      await page.click('a[data-control-name="topcard_see_all_employees"]');

      const people = [];
      let totalResult = 0;
      let pageCount = 1;

      // iterate all pages
      while (true) {
        info("Page " + pageCount + " is parsing...");

        await page.waitForNavigation({
          waitUntil: "networkidle2",
        });

        await autoScroll(page);

        let userListHTML = await page.evaluate(() => {
          return document.documentElement.innerHTML;
        });

        const $ = cheerio.load(userListHTML);

        totalResult = $("h3.search-results__total").text().trim().split(" ")[0];

        // iterate all people in the current page
        $(".search-result__info").each((i, el) => {
          let userUrl = 'https://www.linkedin.com' + $(el).find('a[data-control-name="search_srp_result"]').prop('href');
          let userName = $(el).find("span.actor-name").text().trim();
          let userTitle = $(el).find("p.subline-level-1").text().trim();
          let userLocation = $(el).find("p.subline-level-2").text().trim();
          people.push({
            company,
            name: userName,
            title: userTitle,
            location: userLocation,
            url: userUrl,
          });
        });

        let nextButton = await $(".artdeco-pagination__button--next");
        if ($(nextButton).prop("disabled")) {
          break;
        } else {
          pageCount += 1;
          page.click(".artdeco-pagination__button--next");
        }
      }

      info("Total parsed employee is " + totalResult);
      await page.close();

      return people;
    } catch (error) {
      info(error);
      await this.close();
    }
  }
}

module.exports = Parser;
