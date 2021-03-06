const userModel = require("../models/user.model");
const isAuth = require("../middlewares/auth.middleware");
const collectionModel = require("../models/collection.model");
const itemModel = require("../models/item.model");
const tagModel = require("../models/tag.model");
const ObjectsToCsv = require("objects-to-csv");
const fs = require("fs");
const { Types } = require("mongoose");
const { check, validationResult } = require("express-validator");
const { Router } = require("express");

const router = Router();

router.post(
  "/createCollection",
  [
    check("name", "Не заполненно поле name").isLength({ min: 3, max: 22 }),
    check("description", "Не заполненно поле name").isLength({
      min: 0,
      max: 300,
    }),
    check("img_id", "Отсутствует картинка").isLength({ min: 1 }),
    isAuth,
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Некорректные данные",
        });
      }

      if (
        req.user.role !== "Admin" &&
        req.user._id.toString() !== req.body.userId
      ) {
        return res.status(400).json({ message: "У вас недостаточно прав" });
      }

      const user = await userModel.findOne({ _id: req.body.userId });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Такого пользователя не существует" });
      }
      const collection = new collectionModel({
        ownerId: req.body.userId,
        ownerName: user.username,
        name: req.body.name,
        theme: req.body.theme,
        description: req.body.description,
        img_id: req.body.img_id,
        img_format: req.body.img_format,
        items: 0,
        advancedFields: req.body.advancedFields,
      });

      await collection.save();

      res.status(201).json({ message: "Коллекция создана", ok: true });
    } catch (e) {
      res.status(201).json({ message: e.message });
    }
  }
);

router.post("/getCollection", async (req, res) => {
  try {
    const collection = await collectionModel.findOne({ _id: req.body.id });

    if (!collection) {
      return res.status(400).json({ message: "Коллекция не найдена" });
    }

    res
      .status(200)
      .json({ message: "Коллекция найдена", collection, ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так" });
  }
});

router.post("/getCollections", async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.id });
    const collections = await collectionModel.find({ ownerId: req.body.id });

    res.status(200).json({
      message: "Коллекции найдены",
      owner: user,
      collections,
      ok: true,
    });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так" });
  }
});

router.get("/getAllCollections", async (req, res) => {
  try {
    const collections = await collectionModel.find({});

    res
      .status(200)
      .json({ message: "Коллекции найдены", collections, ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так" });
  }
});

router.post("/getItems", async (req, res) => {
  try {
    const items = await itemModel.find({ parent: req.body.id });

    res.status(200).json({ message: "Итемы найдены", items, ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так" });
  }
});

router.get("/getAllItems", async (req, res) => {
  try {
    const items = await itemModel.find({});

    res.status(200).json({ message: "Итемы найдены", items, ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так" });
  }
});

router.post("/createItem", isAuth, async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user._id.toString() !== req.body.ownerId
    ) {
      return res.status(400).json({ message: "У вас недостаточно прав" });
    }
    const objectId = Types.ObjectId();

    const tags = req.body.tags;

    let tagsId = [];

    for (let i = 0; i < tags.length; i++) {
      const tag = tagModel.findOne({ name: tags[i] });

      if (tag) {
        tag.items = [...tag.items, objectId];
        tag.value = tag.value + 1;
        tag.save();
        tagsId.push(tag._id);
      } else {
        const newTag = new tagModel({
          _id: Types.ObjectId(),
          name: tags[i],
          value: 1,
          items: [objectId],
        });
        newTag.save();
        tagsId.push(newTag._id);
      }
    }

    const collection = await collectionModel.findOne({ _id: req.body.id });

    collection.items += 1;

    await collection.save();

    const item = new itemModel({
      _id: objectId,
      name: req.body.name,
      parentName: req.body.parentName,
      tags: tagsId,
      ownerId: req.body.ownerId,
      fields: req.body.fields,
      parent: req.body.id,
      comments: [],
      likes: [],
      img_id: req.body.img_id,
      img_format: req.body.img_format,
    });

    await item.save();

    res.status(201).json({ message: "Итем создан", ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так", error: e.message });
  }
});

router.post("/editCollection", isAuth, async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user._id.toString() !== req.body.ownerId
    ) {
      return res.status(400).json({ message: "У вас недостаточно прав" });
    }
    let collection = await collectionModel.findOne({ _id: req.body.id });
    if (req.body.edit.name) collection.name = req.body.edit.name;
    if (req.body.edit.description)
      collection.description = req.body.edit.description;
    if (req.body.edit.img_id) {
      collection.img_id = req.body.edit.img_id;
      collection.img_format = req.body.edit.img_format;
    }

    await collection.save();

    res
      .status(200)
      .json({ message: "Редактирование прошло успешно", ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так", error: e.message });
  }
});

router.post("/editCollectionFields", isAuth, async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user._id.toString() !== req.body.ownerId
    ) {
      return res.status(400).json({ message: "У вас недостаточно прав" });
    }

    let collection = await collectionModel.findOne({ _id: req.body.id });

    collection.advancedFields = req.body.fields;

    let items = await itemModel.find({ parent: req.body.id });

    items.forEach(async (el) => {
      el.fields = req.body.fields.map((e, i) => {
        if (typeof e.new !== "undefined") {
          return {
            type: e.type,
            name: e.name,
            value: e.type !== "checkbox" ? "" : false,
          };
        } else {
          return { type: e.type, name: e.name, value: el.fields[i].value };
        }
      });
      await el.save();
    });

    await collection.save();

    res
      .status(200)
      .json({ message: "Редактирование прошло успешно", ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так", error: e.message });
  }
});

router.post("/deleteCollection", isAuth, async (req, res) => {
  try {
    if (
      req.user.role !== "Admin" &&
      req.user._id.toString() !== req.body.ownerId
    ) {
      return res.status(400).json({ message: "У вас недостаточно прав" });
    }

    let collection = await collectionModel.findOne({ _id: req.body.id });

    if (!collection) {
      return res.status(400).json({ message: "Коллекция не найдена" });
    }

    const items = await itemModel.find({ parent: req.body.id });

    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].tags.length; j++) {
        let tag = tagModel.findOne({ _id: items[i].tags[j] });
        tag.value -= 1;
        if (tag.value <= 0) {
          tagModel.deleteOne({ _id: items[i].tags[j] });
        } else {
          let arr = [...tag.items];
          arr.filter((e) => {
            return e !== items[i]._id;
          });
          tag.items = [...arr];
          tag.save();
        }
      }
    }

    await itemModel.deleteMany({ parent: req.body.id });

    await collectionModel.deleteOne({ _id: req.body.id });

    res.status(200).json({ message: "Удаление прошло успешно", ok: true });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так", error: e.message });
  }
});

router.get("/getCSV", async (req, res) => {
  try {
    const items = await itemModel.find({ parent: req.query.id });

    const list = [];
    Array.from(items).forEach((item) => {
      let obj = {
        name: item.name,
      };
      item.fields.forEach((field) => {
        obj[field.name] =
          typeof field.value !== "undefined"
            ? field.value.toString()
            : "no data";
      });
      obj.likes = item.likes.length;
      obj.comments = item.comments.length;
      list.push(obj);
    });

    const csv = new ObjectsToCsv(list);

    const path = "./tempCSV/";
    const name = req.query.name + ".csv";

    await csv.toDisk(path + name, { allColumns: true, bom: true });

    res.download(path + name, name, () => {
      fs.unlink(path + name, () => {});
    });
  } catch (e) {
    res.status(500).json({ message: "Что-то пошло не так", error: e.message });
  }
});

module.exports = router;
