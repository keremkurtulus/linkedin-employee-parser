const cheerio = require("cheerio");

function info(message, type = "info") {
  if (type == "info") {
    console.info(message);
  } else if (type == "error") {
    console.error(message);
  } else {
    console.log(message);
  }
}

async function autoScroll(page) {
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 500;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

function chunk(array, chunkSize) {
  return [].concat.apply(
    [],
    array.map(function (elem, i) {
      return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
    })
  );
}

module.exports = {
  info,
  autoScroll,
  chunk,
};
