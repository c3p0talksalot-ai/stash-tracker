"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.getItem = getItem;
exports.getAllItems = getAllItems;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.searchItems = searchItems;
exports.getItemsByTag = getItemsByTag;
var watermelondb_1 = require("@nozbe/watermelondb");
var database_1 = require("@/database");
// Convert database model to plain object
function itemToOutput(item) {
    return __awaiter(this, void 0, void 0, function () {
        var props, itemTagsCollection, itemTags, tagIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, item.properties.fetch()
                    // Get tags through item_tags join table
                ];
                case 1:
                    props = _a.sent();
                    itemTagsCollection = database_1.database.get("item_tags");
                    return [4 /*yield*/, itemTagsCollection.query(watermelondb_1.Q.where("item_id", item.id)).fetch()];
                case 2:
                    itemTags = _a.sent();
                    tagIds = itemTags.map(function (it) { return it.tagId; });
                    return [2 /*return*/, {
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            location: item.location,
                            purchaseDate: item.purchaseDate,
                            purchasePrice: item.purchasePrice,
                            tags: tagIds,
                            properties: props.map(function (p) { return ({
                                key: p.key,
                                value: p.value,
                                unit: p.unit,
                            }); }),
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                        }];
            }
        });
    });
}
// CRUD Operations
function createItem(input) {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, newItem;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, database_1.database.write(function () { return __awaiter(_this, void 0, void 0, function () {
                            var item, propsCollection, _loop_1, _i, _a, prop, itemTagsCollection, _loop_2, _b, _c, tagId;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, itemsCollection.create(function (record) {
                                            record.name = input.name;
                                            record.description = input.description || "";
                                            record.location = input.location || "";
                                            record.purchaseDate = input.purchaseDate || 0;
                                            record.purchasePrice = input.purchasePrice || 0;
                                        })
                                        // Add properties
                                    ];
                                    case 1:
                                        item = _d.sent();
                                        if (!(input.properties && input.properties.length > 0)) return [3 /*break*/, 5];
                                        propsCollection = database_1.database.get("properties");
                                        _loop_1 = function (prop) {
                                            return __generator(this, function (_e) {
                                                switch (_e.label) {
                                                    case 0: return [4 /*yield*/, propsCollection.create(function (p) {
                                                            p.itemId = item.id;
                                                            p.key = prop.key;
                                                            p.value = prop.value;
                                                            p.unit = prop.unit || "";
                                                        })];
                                                    case 1:
                                                        _e.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _i = 0, _a = input.properties;
                                        _d.label = 2;
                                    case 2:
                                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                                        prop = _a[_i];
                                        return [5 /*yield**/, _loop_1(prop)];
                                    case 3:
                                        _d.sent();
                                        _d.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5:
                                        if (!(input.tags && input.tags.length > 0)) return [3 /*break*/, 9];
                                        itemTagsCollection = database_1.database.get("item_tags");
                                        _loop_2 = function (tagId) {
                                            return __generator(this, function (_f) {
                                                switch (_f.label) {
                                                    case 0: return [4 /*yield*/, itemTagsCollection.create(function (it) {
                                                            it.itemId = item.id;
                                                            it.tagId = tagId;
                                                        })];
                                                    case 1:
                                                        _f.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _b = 0, _c = input.tags;
                                        _d.label = 6;
                                    case 6:
                                        if (!(_b < _c.length)) return [3 /*break*/, 9];
                                        tagId = _c[_b];
                                        return [5 /*yield**/, _loop_2(tagId)];
                                    case 7:
                                        _d.sent();
                                        _d.label = 8;
                                    case 8:
                                        _b++;
                                        return [3 /*break*/, 6];
                                    case 9: return [2 /*return*/, item];
                                }
                            });
                        }); })];
                case 1:
                    newItem = _a.sent();
                    return [2 /*return*/, itemToOutput(newItem)];
            }
        });
    });
}
function getItem(id) {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, item, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection.find(id)];
                case 1:
                    item = _b.sent();
                    return [2 /*return*/, itemToOutput(item)];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAllItems() {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection.query().fetch()];
                case 1:
                    items = _a.sent();
                    return [2 /*return*/, Promise.all(items.map(itemToOutput))];
            }
        });
    });
}
function updateItem(id, input) {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, item_1, _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection.find(id)];
                case 1:
                    item_1 = _b.sent();
                    return [4 /*yield*/, database_1.database.write(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, item_1.update(function (record) {
                                            if (input.name !== undefined)
                                                record.name = input.name;
                                            if (input.description !== undefined)
                                                record.description = input.description;
                                            if (input.location !== undefined)
                                                record.location = input.location;
                                            if (input.purchaseDate !== undefined)
                                                record.purchaseDate = input.purchaseDate;
                                            if (input.purchasePrice !== undefined)
                                                record.purchasePrice = input.purchasePrice;
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _b.sent();
                    return [2 /*return*/, itemToOutput(item_1)];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function deleteItem(id) {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, item_2, _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection.find(id)];
                case 1:
                    item_2 = _b.sent();
                    return [4 /*yield*/, database_1.database.write(function () { return __awaiter(_this, void 0, void 0, function () {
                            var props, _i, props_1, prop, itemTagsCollection, itemTags, _a, itemTags_1, it_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, item_2.properties.fetch()];
                                    case 1:
                                        props = _b.sent();
                                        _i = 0, props_1 = props;
                                        _b.label = 2;
                                    case 2:
                                        if (!(_i < props_1.length)) return [3 /*break*/, 5];
                                        prop = props_1[_i];
                                        return [4 /*yield*/, prop.destroyPermanently()];
                                    case 3:
                                        _b.sent();
                                        _b.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5:
                                        itemTagsCollection = database_1.database.get("item_tags");
                                        return [4 /*yield*/, itemTagsCollection.query(watermelondb_1.Q.where("item_id", id)).fetch()];
                                    case 6:
                                        itemTags = _b.sent();
                                        _a = 0, itemTags_1 = itemTags;
                                        _b.label = 7;
                                    case 7:
                                        if (!(_a < itemTags_1.length)) return [3 /*break*/, 10];
                                        it_1 = itemTags_1[_a];
                                        return [4 /*yield*/, it_1.destroyPermanently()];
                                    case 8:
                                        _b.sent();
                                        _b.label = 9;
                                    case 9:
                                        _a++;
                                        return [3 /*break*/, 7];
                                    case 10: 
                                    // Delete item
                                    return [4 /*yield*/, item_2.destroyPermanently()];
                                    case 11:
                                        // Delete item
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _b.sent();
                    return [2 /*return*/, true];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function searchItems(query) {
    return __awaiter(this, void 0, void 0, function () {
        var itemsCollection, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection
                            .query(watermelondb_1.Q.where("name", watermelondb_1.Q.like("%".concat(watermelondb_1.Q.sanitizeLikeString(query), "%"))))
                            .fetch()];
                case 1:
                    items = _a.sent();
                    return [2 /*return*/, Promise.all(items.map(itemToOutput))];
            }
        });
    });
}
function getItemsByTag(tagId) {
    return __awaiter(this, void 0, void 0, function () {
        var itemTagsCollection, itemTags, itemIds, itemsCollection, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    itemTagsCollection = database_1.database.get("item_tags");
                    return [4 /*yield*/, itemTagsCollection.query(watermelondb_1.Q.where("tag_id", tagId)).fetch()];
                case 1:
                    itemTags = _a.sent();
                    itemIds = itemTags.map(function (it) { return it.itemId; });
                    if (itemIds.length === 0)
                        return [2 /*return*/, []];
                    itemsCollection = database_1.database.get("items");
                    return [4 /*yield*/, itemsCollection
                            .query(watermelondb_1.Q.where("id", watermelondb_1.Q.oneOf(itemIds)))
                            .fetch()];
                case 2:
                    items = _a.sent();
                    return [2 /*return*/, Promise.all(items.map(itemToOutput))];
            }
        });
    });
}
