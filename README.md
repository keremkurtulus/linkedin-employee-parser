# Self Improvement Project

This application developed for parsing people informations for LinkedIn. That application needs your LinkedIn account session cookie value to search people. LinkedIn does not allow scrapping without a authanticated session. I recommend you to use a dummy LinkedIn account for that project. But LinkedIn can hide people's information if you use a dummy account which is created new.

## Running the project

Please create a new table on Airtable by using <b>People-all.csv</b> file that I shared. You should get your airtable api_key and base_id,  from [Airtable API](https://airtable.com/api). Then, change AIRTABLE_API_KEY, AIRTABLE_BASE_ID and AIRTABLE_TABLE fields in <b>.env</b> file with yours.

- `npm install` to install the dependencies
- Login to your (dummy) LinkedIn account using your browser and open your browser's Dev Tools to find the cookie with the name `li_at`. Use that value in LINKEDIN_SESSION_VALUE field in  <b>.env</b> file.
- You can modify the companies array in <b>source/companies.js</b>.  
- `npm start` to run
