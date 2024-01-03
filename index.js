const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport);
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const cors = require("cors");
const session = require("express-session");
const sessionFileStore = require("session-file-store");
const FileStore = sessionFileStore(session);
const port = process.env.PORT || 3005;
// 連接mongodb
mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => {
    console.log("連接到 MongoDB");
  })
  .catch((error) => {
    console.error("連接到 MongoDB 時發生錯誤:", error.message);
  });

// Middlewares
// app.use(
//   session({
//     secret: process.env.PASSPORT_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     name: "login",
//   })
// );
// fileStore的選項
const fileStoreOptions = {};

app.use(
  session({
    store: new FileStore(fileStoreOptions), // 使用檔案記錄session
    name: "SESSION_INDEX", // cookie名稱，儲存在瀏覽器裡
    secret: process.env.PASSPORT_SECRET,
    cookie: {
      maxAge: 30 * 86400000, // session保存30天
      // httpOnly: false,
      // sameSite: 'none',
    },
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: [
    "https://mern-api-fzml.onrender.com",
    "https://mern-lsh5.onrender.com",
  ],
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // 替換為實際需要允許的方法
};

app.use(cors(corsOptions));

app.use("/api/user", authRoute);
// course route應該被jwt保護
// 如果request header內部沒有jwt，則request就會被視為是unauthorized
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

// 只有登入系統的人才能新增課程或註冊課程
// jwt

app.listen(port, () => {
  console.log("已啟動後端伺服器");
});
