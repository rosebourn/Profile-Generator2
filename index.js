const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const util = require("util");
const generateHTML = require("./generateHTML");
const path = require("path");

// electron package
const convertFactory = require("electron-html-to");
const conversion = convertFactory({
  converterPath: convertFactory.converters.PDF
});

const writeFileAsync = util.promisify(fs.writeFile);
let data;

function promptUser() {
  inquirer
    .prompt([
      {
        message: "Enter your GitHub username:",
        name: "username"
      },
      {
        message: "What color would you like?",
        name: "color",
        type: "list",
        choices: ["red", "blue", "green", "pink"]
      }
    ])

    .then(function({ username, color }) {
      console.log(username, color);
      let usercolor = color;
      console.log("usercolor", usercolor);

      const queryUrl = `https://api.github.com/users/${username}`;

      axios
        .get(queryUrl)
        .then(function(res) {
          data = {
            color: usercolor,
            image: res.data.avatar_url,
            name: res.data.name,
            login: res.data.login,
            bio: res.data.bio,
            publicRepos: res.data.public_repos,
            followers: res.data.followers,
            following: res.data.following
          };
          console.log("data object", data);
        })
        .then(function() {
          const starUrl = `https://api.github.com/users/${username}/starred`;

          axios.get(starUrl).then(function(res) {
            const stars = ("stars", res.data.length);
            console.log("stars", stars);

            data.stars = stars;

            let htmlres = generateHTML(data);
            convertToPDF(htmlres);
            writeFileAsync("index.html", htmlres);
          });
        });
    });
}

function convertToPDF(html) {
  conversion({ html }, function(err, result) {
    if (err) {
      return console.error(err);
    }

    console.log(result.numberOfPages);
    console.log(result.logs);
    result.stream.pipe(
      fs.createWriteStream(path.join(__dirname, "profile.pdf"))
    );
    conversion.kill(); // necessary if you use the electron-server strategy, see below for details
  });
}

promptUser();
