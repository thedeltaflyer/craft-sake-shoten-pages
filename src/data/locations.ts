import kawasaki from "../assets/photos/kawasaki-shop.webp";
import fridge from "../assets/photos/kawasaki-interior-fridge.jpg";
import counter from "../assets/photos/kawasaki-interior-counter.jpg";
import yokohama from "../assets/photos/yokohama-shop.webp";
import entrance from "../assets/photos/yokohama-entrance.jpg";
import crowd from "../assets/photos/yokohama-crowd.webp";
import selection from "../assets/photos/yokohama-selection.webp";
import bottles from "../assets/photos/yokohama-sake-2.webp";
export const locations = {
  yokohama: {
    image: yokohama,
    gallery: [
      { image: crowd, alt: "yokohamaCrowdAlt" },
      { image: selection, alt: "yokohamaSelectionAlt" },
      { image: bottles, alt: "yokohamaSake2Alt" },
    ],
    supporting: [{ image: entrance, alt: "entranceAlt" }],
    alt: "yokohamaShopAlt",
    instagram: "https://www.instagram.com/craftsakeshoten/",
    map: "https://maps.app.goo.gl/GTe5G3uBdNcQgTiW9",
    postalCode: "220-0005",
    street: "2-18-3 Minamisaiwai, Shimada Heights 2F",
    city: "Nishi-ku, Yokohama",
    hours: [
      { days: "tueThu", time: "17:00–22:00" },
      { days: "fri", time: "17:00–23:00" },
      { days: "sat", time: "17:00–22:00" },
      { days: "sunMon", time: null },
    ],
    openingHours: ["Tu-Th 17:00-22:00", "Fr 17:00-23:00", "Sa 17:00-22:00"],
  },
  kawasaki: {
    image: kawasaki,
    gallery: [],
    supporting: [
      { image: fridge, alt: "kawasakiFridgeAlt" },
      { image: counter, alt: "kawasakiCounterAlt" },
    ],
    alt: "kawasakiShopAlt",
    instagram: "https://www.instagram.com/craftsakeshotenkawasaki/",
    map: "https://maps.app.goo.gl/jbxT87Bs1cUszbsj8",
    postalCode: "212-8554",
    street: "1310 Omiyacho, Muza Kawasaki 1F",
    city: "Saiwai-ku, Kawasaki",
    hours: [],
    openingHours: [],
  },
};
export type LocationId = keyof typeof locations;
