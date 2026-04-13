import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SAMPLE_CUSTOMERS: Array<{ name: string; address: string }> = [
  { name: "Kovács Anna", address: "1011 Budapest, Fő utca 12." },
  { name: "Nagy Béla", address: "6720 Szeged, Tisza Lajos körút 47." },
  { name: "Szabó Csilla", address: "4025 Debrecen, Piac utca 8." },
  { name: "Tóth Dániel", address: "7621 Pécs, Király utca 22." },
  { name: "Horváth Eszter", address: "9022 Győr, Baross Gábor út 5." },
  { name: "Varga Ferenc", address: "3525 Miskolc, Széchenyi utca 33." },
  { name: "Kiss Gabriella", address: "8200 Veszprém, Kossuth utca 14." },
  { name: "Molnár Hunor", address: "5000 Szolnok, Szapáry utca 19." },
  { name: "Németh Ildikó", address: "2500 Esztergom, Bajcsy-Zsilinszky út 7." },
  { name: "Farkas János", address: "1132 Budapest, Váci út 99." },
  { name: "Balogh Katalin", address: "8900 Zalaegerszeg, Kossuth utca 41." },
  { name: "Papp László", address: "6000 Kecskemét, Rákóczi út 3." },
];

function buildSearchText(name: string, address: string): string {
  return `${name} ${address}`;
}

export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const trimmed = q.trim();
    if (trimmed === "") {
      return await ctx.db.query("customers").order("asc").take(20);
    }
    return await ctx.db
      .query("customers")
      .withSearchIndex("search_text", (qb) => qb.search("searchText", trimmed))
      .take(20);
  },
});

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("customers").take(1);
    if (existing.length > 0) return { inserted: 0 };
    for (const c of SAMPLE_CUSTOMERS) {
      await ctx.db.insert("customers", {
        name: c.name,
        address: c.address,
        searchText: buildSearchText(c.name, c.address),
      });
    }
    return { inserted: SAMPLE_CUSTOMERS.length };
  },
});
