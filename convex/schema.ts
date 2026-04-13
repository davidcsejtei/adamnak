import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  customers: defineTable({
    name: v.string(),
    address: v.string(),
    searchText: v.string(),
  }).searchIndex("search_text", {
    searchField: "searchText",
  }),
});
