import { Octokit } from "octokit";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const appendToFile = (
  filepath,
  data,
  format = undefined,
  callback = () => {}
) => {
  if (format === undefined) {
    fs.appendFile(filepath, data, callback);
    return;
  }
  fs.appendFile(filepath, data, format, callback);
};

const octokit = new Octokit({
  auth: process.env.GITHUB_AUTH_TOKEN,
});
const q = encodeURI("location:Bangalore followers:>100");

const fetchUsers = async () => {
  let responses = [];
  const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
  let pagesRemaining = true;

  let url = `/search/users?q=${q}`;

  while (pagesRemaining) {
    const response = await octokit.request(`GET ${url}`, {
      per_page: 100,
    });
    console.log("Fetching: " + url);

    const data = await response.data.items;
    responses = [...responses, ...data];

    const linkHeader = response.headers.link;

    pagesRemaining = false;
    pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);

    if (pagesRemaining) {
      url = linkHeader.match(nextPattern)[0];
    }
  }

  appendToFile(
    "data/users.csv",
    "Login, Name, Company, Location, Email, Hireable, Bio, Public Repositories, Followers, Following, Created At\n"
  );

  for (const u of responses) {
    if (!u.login) continue;
    console.log("Fetching info about: ", u.login);
    const user_res = await octokit.request(`GET /users/${u.login}`);
    const user = await user_res.data;

    const new_user_record = {
      login: user.login,
      name: user.name,
      company: user.company?.trim("@"),
      location: user.location,
      email: user.email,
      hireable: user.hireable,
      bio: user.bio,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      created_at: user.created_at,
    };

    for (const record in new_user_record) {
      if (typeof new_user_record[record] === "string") {
        new_user_record[record] = new_user_record[record]
          .replaceAll(",", "!!comma!!")
          .replaceAll("\n", " ")
          .replaceAll("|", "!!pipe!!");
      }
    }

    const out = `${new_user_record.login}, ${new_user_record.name}, ${new_user_record.company}, ${new_user_record.location}, ${new_user_record.email}, ${new_user_record.hireable}, ${new_user_record.bio}, ${new_user_record.public_repos}, ${new_user_record.followers}, ${new_user_record.following}, ${new_user_record.created_at}`;

    appendToFile("data/users.csv", out + "\n", () => {
      console.log("Adding: ", new_user_record.login);
    });
  }
};

fetchUsers();
