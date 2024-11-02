# TDS-project-1
This repo contains all the code that was required to scrape the data from Github API in TDS-project-1. 

- Data Extraction: The code to scrape the data can be found in the `main.js` and `repos.js` files.
    * The data  was extracted using pagination example provided by github and calling the endpoints `/search/users` and `/users/${username}/repos`


- Some Interesting Observations
  * Creating a public repository, you can earn about 2 followers.
  * People who want to get hired, do not provide their email address in the profile.

- Point of action for a developer
  * If getting hired is your objective, I would suggest you putting your email in your profile. So when a recruiter uses the api, he'll have a point of action directly available.
  * Many of the recruiters won't go through your bio when they are hiring in a good quantity.
