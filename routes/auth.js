const router = require("express").Router();
const { registerValidation } = require("../validation");
const { loginValidation } = require("../validation");
const { courseValidation } = require("../validation");
const User = require("../models").user;
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middlewares/jwt");
const passport = require("passport");
router.use((req, res, next) => {
  console.log("正在接收一個跟auth有關的請求");
  next();
});

router.post("/register", async (req, res) => {
  //  確認數據是否符合規範
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認信箱是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("電子郵件已被註冊");

  // 製作新用戶
  let { email, username, password, role } = req.body;
  let newUser = new User({
    email,
    username,
    password,
    role,
  });
  try {
    let savedUser = await newUser.save();

    return res.send({ msg: "使用者成功註冊", savedUser });
  } catch (e) {
    console.log("Error during user save:", e);
    return res.status(500).send("無法儲存使用者");
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認信箱是否被註冊過
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser)
    return res.status(401).send("無法找到使用者，請確認信箱是否正確");

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);

    if (isMatch) {
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      console.log("isMatch tokenObject : ", tokenObject);
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      console.log("isMatch token : ", token);
      req.session.user = {
        _id: foundUser._id,
      };
      res.cookie("SESSION_ID", token, { httpOnly: false });

      return res.json({
        message: "成功登入",
        code: "200",
        token: token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密碼錯誤");
    }
  });
});
// google登入
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);
// 處理 Google 登入的回調
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // 登入成功的處理
    res.redirect("/");
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("登出失敗");
    }
    res.clearCookie("SESSION_ID", {
      domain: "localhost",
      path: "/",
    });

    // 清除 cookie
    res.status(200).send("成功登出");
  });
});

// 讀取會員資料
router.get("/private", authenticate, (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "未授權的訪問" });
  }

  // 獲取登入的會員資料
  const userData = req.session.user;
  return res.json({ message: "成功獲取會員資料", userData });
});

module.exports = router;
