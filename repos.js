import { Octokit } from "octokit";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const appendToFile = (
  filepath,
  data,
  format = undefined,
  callback = () => {},
) => {
  if (format === undefined) {
    fs.appendFile(filepath, data, callback);
    return;
  }
  fs.appendFile(filepath, data, format, callback);
};

appendToFile(
  "repositories.csv",
  "login,full_name,created_at,stargazers_count,watchers_count,language,has_projects,has_wiki,license_name\n",
);

const octokit = new Octokit({
  auth: process.env.GITHUB_AUTH_TOKEN,
});

const fetchRepos = async (username) => {
  let responses = [];
  const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
  let pagesRemaining = true;

  let url = `/users/${username}/repos`;

  while (pagesRemaining) {
    const response = await octokit.request(`GET ${url}`, {
      per_page: 100,
    });
    console.log("Fetching: " + url);

    const data = await response.data;
    responses = [...responses, ...data];

    const linkHeader = response.headers.link;

    pagesRemaining = false;
    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);

    if (pagesRemaining) {
      url = linkHeader.match(nextPattern)[0];
    }

    new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
      console.log("New data fetching: " + url),
    );
  }

  for (const response of responses) {
    const {
      full_name,
      created_at,
      stargazers_count,
      watchers_count,
      language,
      has_projects,
      has_wiki,
      license,
    } = response;

    let license_name = "";
    if (license) {
      license_name = license.name;
    }

    const str = `${username}, ${full_name}, ${created_at}, ${stargazers_count}, ${watchers_count}, ${language}, ${has_projects}, ${has_wiki}, ${license_name}`;

    appendToFile("repositories.csv", str + "\n", () => {
      console.log("Adding:", full_name);
    });
  }
};

fs.readFile("users.csv", "utf8", function (err, data) {
  const users = data.split("\n");

  const usernames = users.map((u) => {
    return u.split(",")[0];
  });

  for (let i = 1; i < usernames.length; i++) {
    fetchRepos(usernames[i]);

    new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
      console.log("New data fetching for: " + usernames[i + 1]),
    );
  }
});
