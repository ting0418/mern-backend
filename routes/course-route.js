const router = require("express").Router();
const { course } = require("../models");
const { courseValidation } = require("../validation");

router.use((req, res, next) => {
  console.log("course route正在接收一個request");
  next();
});
// 獲得系統中所有課程
router.get("/", async (req, res) => {
  try {
    let courseFound = await course
      .find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});
// 透過單一id來找到資料
router.get("/:_id", async (req, res) => {
  let id = req.params._id;
  try {
    let foundUserById = await course
      .find({ _id: id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(foundUserById);
  } catch (e) {
    return res.status(500).send(e);
  }
});
// 新增課程
router.post("/", async (req, res) => {
  // 驗證數據符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師可以發布新課程，若你已經是講師，請透過講師帳號登入");
  }
  let { title, description, price } = req.body;
  try {
    let newCourse = new course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    // 儲存新課程到資料庫
    let savedCourse = await newCourse.save();
    return res.send({
      message: "新課程已經保存",
      savedCourse,
    });
  } catch (e) {
    return res.status(500).send("無法創建課程...");
  }
});
// 更改課程
router.patch("/:_id", async (req, res) => {
  // 驗證是否符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let { _id } = req.params;
  // 確認課程是否存在
  try {
    let courseFound = await course.findOne({ _id });

    if (!courseFound) return res.status(400).send("找不到課程，沒辦法修改課程");

    // 使用者必須是講師才可以編輯課程內容
    if (courseFound.instructor.equals(req.user._id)) {
      let updateCourse = await course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({ message: "課程被更新成功", updateCourse });
    } else {
      res.status(403).send("只有此課程講師才可以更新課程內容");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

// 刪除課程

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  // 確認課程是否存在
  try {
    let courseFound = await course.findOne({ _id }).exec();

    if (!courseFound) return res.status(400).send("找不到課程，沒辦法刪除課程");

    // 使用者必須是講師才可以刪除課程內容
    if (courseFound.instructor.equals(req.user._id)) {
      await course.deleteOne({ _id }).exec();
      return res.send("課程被刪除成功");
    } else {
      res.status(403).send("只有此課程講師才可以刪除課程內容");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});
module.exports = router;
