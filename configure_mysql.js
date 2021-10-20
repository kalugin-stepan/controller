#!/usr/bin/env node

const fs = require("fs");
const DataBase = require("./dist/database.js").DataBase;
DataBase.configure(JSON.parse(fs.readFileSync("./mysql_config.json")));