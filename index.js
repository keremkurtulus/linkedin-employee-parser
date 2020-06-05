const Parser = require("./parser");
const companies = require("./source/companies");
const { chunk } = require("./utils");

var Airtable = require("airtable");
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

(async () => {
  const parser = new Parser({
    sessionCookieValue: process.env.LINKEDIN_SESSION_VALUE,
  });
  await parser.init();

  const people = [];
  for (const company of companies) {
    const companyEmployees = (await parser.getPeopleList(company)) || [];
    people.push(...companyEmployees);
  }

  parser.close();

  const airtableArray = [];
  for (const person of people) {
    airtableArray.push({
      fields: {
        "Person Name": person.name,
        "Person Title": person.title,
        "Person Location": person.location,
        "User URL": person.url,
        "Company Name": person.company.name,
        "Company URL": person.company.url,
      },
    });
  }

  // Airtable allows to create maximum 10 records per request, I split airtableArray into 10 element arrays
  const splitArray = chunk(airtableArray, 10);

  for (const recordGroup of splitArray) {
    base(process.env.AIRTABLE_TABLE).create(recordGroup, function (
      err,
      records
    ) {
      if (err) {
        console.error(err);
        return;
      }
      /* records.forEach(function (record) {
        console.log(record.getId());
      }); */
    });
  }

  console.log("Airtable: Records are created!");
})();
