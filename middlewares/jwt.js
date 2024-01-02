const jsonwebtoken = require("jsonwebtoken");
const dotenv = require("dotenv");
// dotenv.config();

const accessTokenSecret = process.env.PASSPORT_SECRET;

function authenticate(req, res, next) {
  const token = req.cookies.SESSION_ID;
  console.log("AUTHEN取得token : ", token);

  if (!token) {
    return res.json({ message: "Unauthorized", code: "401" });
  }

  jsonwebtoken.verify(token, accessTokenSecret, (err, user) => {
    if (err) {
      console.error(err);
      return res.json({ message: "Forbidden", code: "403" });
    }

    // 將使用者信息存儲在 req.session 中
    req.session.user = user;
    next();
  });
}

module.exports = { authenticate };
