// updated

const dbConnection = require("../db/dbconfig");
async function install(req, res) {
  
  let createuser = `CREATE TABLE if not exists users(
    userid int(20) not null auto_increment,
    username varchar(20) not null,
    firstname varchar(20) not null,
    lastname varchar(20) not null,
    email varchar(20) not null,
    password varchar(100) not null,
    PRIMARY KEY(userid)
)`;
  let createquestions = `CREATE TABLE if not exists questions(
    id int(20) not null auto_increment,
    questionid varchar(100) not null UNIQUE,
    userid int(20) not null,
    title varchar(200) not null,
    description varchar(300) not null,
    tag varchar(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id,questionid),
    FOREIGN KEY (userid) REFERENCES users(userid)
)`;
  let createanswers = `CREATE TABLE if not exists answers(
    answerid int(20) not null auto_increment,
    userid int(20) not null,
    questionid varchar(100) not null,
    answer varchar(500) not null,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (answerid),
    FOREIGN KEY (questionid) REFERENCES questions(questionid),
    FOREIGN KEY (userid) REFERENCES users(userid)
    
)`;
  try {
    await dbConnection.query(createuser);
    await dbConnection.query(createquestions);
    await dbConnection.query(createanswers);
    return res.status(201).json({ msg: "table created" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ msg: "someting went wrong,try again later" });
  }
}

module.exports = { install };
